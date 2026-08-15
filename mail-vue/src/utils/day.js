import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ru'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {useSettingStore} from "@/store/setting.js";
const settingStore = useSettingStore();
dayjs.extend(utc)
dayjs.extend(timezone)

/** App language code -> dayjs locale name. */
function dayjsLocale(lang) {
    if (lang === 'zh') return 'zh-cn'
    if (lang === 'ru') return 'ru'
    return 'en'
}

dayjs.locale(dayjsLocale(settingStore.lang))
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Russian counts things in three grammatical forms, chosen by the last digits:
 *   1 минута · 2 минуты · 5 минут
 * Picking one form and hoping for the best reads as broken, so decline properly.
 */
function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;

    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
}

export function fromNow(date) {
    const d = dayjs.utc(date).tz(timeZone);
    const now = dayjs();
    const diffSeconds = now.diff(d, 'second');
    const diffMinutes = now.diff(d, 'minute');
    const diffHours = now.diff(d, 'hour');
    const isToday = now.isSame(d, 'day');
    const lang = settingStore.lang;

    if (lang === 'ru') {

        if (isToday) {
            if (diffSeconds < 60) return 'только что';
            if (diffMinutes < 60) {
                return `${diffMinutes} ${plural(diffMinutes, 'минуту', 'минуты', 'минут')} назад`;
            }
            if (diffHours < 2) return 'час назад';
            return d.format('HH:mm');
        }

        if (now.subtract(1, 'day').isSame(d, 'day')) {
            return `вчера, ${d.format('HH:mm')}`;
        }

        if (now.subtract(2, 'day').isSame(d, 'day')) {
            return `позавчера, ${d.format('HH:mm')}`;
        }

        return d.year() === now.year()
            ? d.format('D MMM')
            : d.format('DD.MM.YYYY');
    }

    if (lang === 'en') {

        if (isToday) {
            if (diffSeconds < 60) return `Just now`;
            if (diffMinutes < 60) return `${diffMinutes} min ago`;
            if (diffHours < 2) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            return d.format('hh:mm A');
        }

        if (now.subtract(1, 'day').isSame(d, 'day')) {
            return d.format('MMM D');
        }

        return d.year() === now.year()
            ? d.format('MMM D')
            : d.format('YYYY/MM/DD');


    } else {

        if (isToday) {
            if (diffSeconds < 60) return `几秒前`;
            if (diffMinutes < 60) return `${diffMinutes}分钟前`;
            if (diffHours >= 1 && diffHours < 2) return '1小时前';
            return d.format('HH:mm');
        }
        else if (now.subtract(1, 'day').isSame(d, 'day')) {
            return `昨天 ${d.format('HH:mm')}`;
        }
        else if (now.subtract(2, 'day').isSame(d, 'day')) {
            return `前天 ${d.format('HH:mm')}`;
        }
        return d.year() === now.year()
            ? d.format('M月D日')
            : d.format('YYYY/M/D');

    }

}

export function updateNow(date) {
    if (isToday) {
        if (diffSeconds < 60) return `Just now`;
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        if (diffHours < 2) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return d.format('hh:mm A');
    }
}

export function formatDetailDate(time) {
    const d = dayjs.utc(time).tz(timeZone);
    const now = dayjs();

    const isSameYear = now.year() === d.year();
    const lang = settingStore.lang;

    if (lang === 'ru') {
        return isSameYear
            ? d.format('dd, D MMMM, HH:mm')
            : d.format('dd, D MMMM YYYY, HH:mm');
    }

    if (lang === 'en') {
        return isSameYear
            ? d.format('ddd, MMM D, h:mm A')
            : d.format('ddd, MMM D, YYYY, h:mm A');
    } else {
        return d.format('YYYY年M月D日 ddd AH:mm');
    }
}

export function tzDayjs(time) {
    return dayjs.utc(time).tz(timeZone)
}

export function toUtc(time) {
    return dayjs(time).utc()
}

export function setExtend(lang) {
    dayjs.locale(lang)
}
