<template>
  <div class="content-box" ref="contentBox">
    <div ref="container" class="content-html"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { blockRemoteContent, revealRemoteContent } from '@/utils/remote-content.js'

const props = defineProps({
  html: {
    type: String,
    required: true
  },
  // Remote images are blocked until the reader explicitly allows them
  blockRemote: {
    type: Boolean,
    default: true
  },
  // Hosts that are ours, not a third party — never blocked
  allowHosts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['remote-blocked'])

const container = ref(null)
const contentBox = ref(null)
let shadowRoot = null
const revealed = ref(false)

defineExpose({ revealRemote, revealed })

/** Puts the stashed remote URLs back and re-fits the content. */
function revealRemote() {
  if (!shadowRoot) return
  revealRemoteContent(shadowRoot)
  revealed.value = true
  requestAnimationFrame(autoScale)
}

function updateContent() {
  if (!shadowRoot) return;

  // 1. 提取 <body> 的 style 属性（如果存在）
  const bodyStyleRegex = /<body[^>]*style="([^"]*)"[^>]*>/i;
  const bodyStyleMatch = props.html.match(bodyStyleRegex);
  const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : '';

  // 2. 移除 <body> 标签（保留内容）
  let cleanedHtml = props.html.replace(/<\/?body[^>]*>/gi, '');

  // 2b. Strip anything that would phone home before the reader agrees to it
  revealed.value = false
  if (props.blockRemote) {
    const result = blockRemoteContent(cleanedHtml, props.allowHosts)
    cleanedHtml = result.html
    emit('remote-blocked', {blocked: result.blocked, trackers: result.trackers})
  } else {
    emit('remote-blocked', {blocked: 0, trackers: 0})
  }

  // 3. 将 body 的 style 应用到 .shadow-content
  shadowRoot.innerHTML = `
    <style>
      :host {
        all: initial;
        width: 100%;
        height: 100%;
        font-family: -apple-system, Inter, BlinkMacSystemFont,
                    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #13181D;
        word-break: break-word;
      }

      h1, h2, h3, h4 {
          font-size: 18px;
          font-weight: 700;
      }

      p {
        margin: 0;
      }

      a {
        text-decoration: none;
        color: #0E70DF;
      }

      .shadow-content {
        background: #FFFFFF;
        width: fit-content;
        height: fit-content;
        min-width: 100%;
        ${bodyStyle ? bodyStyle : ''} /* 注入 body 的 style */
      }

      img:not(table img) {
        max-width: 100%;
        height: auto !important;
      }

      /* A blocked image keeps its slot so the layout does not collapse,
         but reads clearly as a placeholder rather than a broken picture. */
      img.blocked-remote-image {
        min-width: 48px;
        min-height: 48px;
        background: repeating-linear-gradient(
          45deg,
          #f2f2f4,
          #f2f2f4 6px,
          #e8e8ea 6px,
          #e8e8ea 12px
        );
        border: 1px dashed #c7c7cc;
        border-radius: 6px;
        box-sizing: border-box;
      }

    </style>
    <div class="shadow-content">
      ${cleanedHtml}
    </div>
  `;
}

function autoScale() {
  if (!shadowRoot || !contentBox.value) return

  const parent = contentBox.value
  const shadowContent = shadowRoot.querySelector('.shadow-content')

  if (!shadowContent) return

  const parentWidth = parent.offsetWidth
  const childWidth = shadowContent.scrollWidth

  if (childWidth === 0) return

  const scale = parentWidth / childWidth

  const hostElement = shadowRoot.host
  hostElement.style.zoom = scale
}

onMounted(() => {
  shadowRoot = container.value.attachShadow({ mode: 'open' })
  updateContent()
  autoScale()
})

watch(() => props.html, () => {
  updateContent()
  autoScale()
})
</script>

<style scoped>
.content-box {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, Inter, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
}

.content-html {
  width: 100%;
  height: 100%;
}
</style>
