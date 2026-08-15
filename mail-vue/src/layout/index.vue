<template>
  <el-container class="layout">
    <el-aside
        class="aside"
        :class="uiStore.asideShow ? 'aside-show' : 'el-aside-hide'">
      <Aside />
    </el-aside>
    <div
        :class="(uiStore.asideShow && isMobile)? 'overlay-show':'overlay-hide'"
        @click="uiStore.asideShow = false"
    ></div>
    <el-container class="main-container">
      <el-main>
        <el-header>
            <Header />
        </el-header>
        <Main />
      </el-main>
    </el-container>
  </el-container>
  <writer ref="writerRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {useUiStore} from "@/store/ui.js";
import writer from '@/layout/write/index.vue'

const uiStore = useUiStore();
const writerRef = ref({})
const isMobile = ref(window.innerWidth < 1025)
const handleResize = () => {
  isMobile.value = window.innerWidth < 1025
  uiStore.asideShow = window.innerWidth > 1024;
}

onMounted(() => {
  uiStore.writerRef = writerRef

  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
/* Spatial consistency: it comes in from the left, so it leaves to the left.
   The exit curve mirrors the enter curve so the return path matches. */
.el-aside-hide {
  position: fixed;
  left: 0;
  height: 100%;
  z-index: 100;
  transform: translateX(-100%);
  transition: transform 280ms var(--ease-exit);
}

.aside-show {
  transform: translateX(0);
  transition: transform var(--spring-duration) var(--spring);
  z-index: 101;
  @media (max-width: 1025px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 101;
    height: 100%;
    background: var(--aside-backgound);
    -webkit-box-shadow: var(--aside-right-border);
    box-shadow: var(--aside-right-border);
  }
}

.el-aside {
  width: auto;
  transition: all 100ms ease;
}

.layout {
  height: 100%;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
}

.main-container {
  min-height: 100%;
  background: var(--el-bg-color);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.el-main {
  padding: 0;
}

/* Floating chrome: a translucent material rather than an opaque strip.
   No hard 1px rule — a soft scroll edge does the separation instead. */
.el-header {
  position: relative;
  z-index: 10;
  padding: 0 12px 0 4px;
  background: var(--material-regular);
  -webkit-backdrop-filter: var(--blur-regular);
  backdrop-filter: var(--blur-regular);
  box-shadow: var(--material-edge), inset 0 -0.5px 0 0 var(--hairline);
}

.el-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 12px;
  pointer-events: none;
  background: linear-gradient(to bottom, var(--material-regular), transparent);
  -webkit-mask-image: linear-gradient(to bottom, #000, transparent);
  mask-image: linear-gradient(to bottom, #000, transparent);
}

/* A blocking task dims the background; a parallel panel would not */
.overlay-show {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--scrim);
  z-index: 99;
  opacity: 1;
  transition: opacity 280ms var(--ease-enter);
}

.overlay-hide {
  display: flex;
  pointer-events: none;
  opacity: 0;
  transition: opacity 240ms var(--ease-exit);
}
</style>
