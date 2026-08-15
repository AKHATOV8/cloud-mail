/**
 * Remote content blocking for rendered email HTML.
 *
 * Marketing mail embeds 1x1 images ("tracking pixels") whose only purpose is to
 * report back that the message was opened, from which IP, and at what time.
 * Loading them happens silently the moment the email is rendered, so the only
 * effective defence is to strip the remote URLs before the HTML reaches the DOM
 * and put them back only when the reader asks for it.
 *
 * Inline images (cid:) and data: URIs are already part of the message and carry
 * no network request, so they are always left alone.
 */

// A 1x1 fully transparent GIF — keeps layout intact without any request
const PLACEHOLDER =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Remote means "causes a network request to a third party".
 *
 * Our own storage domain is not a third party: attachments the message already
 * carries are rehosted there, so blocking them would break legitimate images
 * without protecting anything.
 */
function isRemote(url, allowHosts = []) {
    if (!url) return false;
    const value = url.trim().toLowerCase();
    if (value.startsWith('cid:')) return false;   // inline attachment
    if (value.startsWith('data:')) return false;  // embedded bytes
    if (value.startsWith('blob:')) return false;

    const looksExternal = /^(https?:)?\/\//.test(value) || value.startsWith('//');
    if (!looksExternal) return false;

    return !allowHosts.some(host => host && value.includes(host.toLowerCase()));
}

/**
 * An image is almost certainly a tracker when it is invisible: 1x1 pixels,
 * zero-sized, or hidden outright. These are worth counting separately because
 * unblocking them has no visual benefit at all.
 */
function looksLikeTracker(img) {
    const w = parseInt(img.getAttribute('width') || '', 10);
    const h = parseInt(img.getAttribute('height') || '', 10);

    if (!isNaN(w) && !isNaN(h) && w <= 3 && h <= 3) return true;

    const style = (img.getAttribute('style') || '').replace(/\s/g, '').toLowerCase();
    if (/(width|height):0(px)?[;$]/.test(style + ';')) return true;
    if (style.includes('display:none') || style.includes('visibility:hidden')) return true;

    // Common tracker path hints, used only as a secondary signal
    const src = (img.getAttribute('src') || '').toLowerCase();
    return /(\/open|\/track|\/pixel|\/beacon|\/wf\/open|utm_|\.gif\?)/.test(src) &&
        (isNaN(w) || w <= 3);
}

/**
 * Strips remote references out of an email's HTML.
 *
 * @param {string} html raw message body
 * @param {string[]} allowHosts hosts treated as first-party (e.g. our own storage)
 * @returns {{html: string, blocked: number, trackers: number}}
 */
export function blockRemoteContent(html, allowHosts = []) {
    if (!html) return {html: '', blocked: 0, trackers: 0};

    let blocked = 0;
    let trackers = 0;

    let doc;
    try {
        doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (e) {
        // If parsing fails we would rather show nothing remote than guess
        console.error('remote-content: parse failed', e);
        return {html, blocked: 0, trackers: 0};
    }

    // 1. <img src> and responsive <img srcset>
    doc.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');

        if (isRemote(src, allowHosts)) {
            if (looksLikeTracker(img)) {
                trackers++;
                // A tracker has no visual role — drop it entirely, don't offer to load it
                img.remove();
                return;
            }

            blocked++;
            img.setAttribute('data-blocked-src', src);
            img.setAttribute('src', PLACEHOLDER);
            img.classList.add('blocked-remote-image');
        }

        const srcset = img.getAttribute('srcset');
        if (srcset && /https?:|^\/\//i.test(srcset)) {
            img.setAttribute('data-blocked-srcset', srcset);
            img.removeAttribute('srcset');
        }
    });

    // 2. CSS background images declared inline
    doc.querySelectorAll('[style]').forEach(el => {
        const style = el.getAttribute('style');
        if (!style || !/url\(/i.test(style)) return;

        const stripped = style.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, url) => {
            if (!isRemote(url, allowHosts)) return match;
            blocked++;
            return 'none';
        });

        if (stripped !== style) {
            el.setAttribute('data-blocked-style', style);
            el.setAttribute('style', stripped);
        }
    });

    // 3. <style> blocks can carry remote urls too, plus @import
    doc.querySelectorAll('style').forEach(styleTag => {
        const css = styleTag.textContent || '';
        if (!/url\(|@import/i.test(css)) return;

        styleTag.textContent = css
            .replace(/@import[^;]+;/gi, '')
            .replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, url) => {
                if (!isRemote(url, allowHosts)) return match;
                blocked++;
                return 'none';
            });
    });

    // 4. Anything that fetches on its own: remote frames, media, beacons
    doc.querySelectorAll('iframe, video, audio, source, embed, object, script, link').forEach(el => {
        const attr = el.hasAttribute('src') ? 'src' : el.hasAttribute('href') ? 'href' : null;
        if (attr && isRemote(el.getAttribute(attr), allowHosts)) {
            trackers++;
        }
        el.remove();
    });

    return {html: doc.body.innerHTML, blocked, trackers};
}

/** Restores the URLs stashed by blockRemoteContent, inside a shadow root or element. */
export function revealRemoteContent(root) {
    if (!root) return;

    root.querySelectorAll('[data-blocked-src]').forEach(img => {
        img.setAttribute('src', img.getAttribute('data-blocked-src'));
        img.removeAttribute('data-blocked-src');
        img.classList.remove('blocked-remote-image');
    });

    root.querySelectorAll('[data-blocked-srcset]').forEach(img => {
        img.setAttribute('srcset', img.getAttribute('data-blocked-srcset'));
        img.removeAttribute('data-blocked-srcset');
    });

    root.querySelectorAll('[data-blocked-style]').forEach(el => {
        el.setAttribute('style', el.getAttribute('data-blocked-style'));
        el.removeAttribute('data-blocked-style');
    });
}
