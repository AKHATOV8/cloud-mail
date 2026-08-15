<template>
  <div class="header" :class="!hasPerm('email:send') ? 'not-send' : ''">
    <div class="header-btn">
      <hanburger @click="changeAside"></hanburger>
      <span class="breadcrumb-item">{{ $t(route.meta.title) }}</span>
    </div>
    <div v-perm="'email:send'" class="writer-box" @click="openSend">
      <div class="writer">
        <Icon icon="material-symbols:edit-outline-sharp" width="20" height="20"/>
        <span class="writer-text">{{ $t('compose') }}</span>
      </div>
    </div>
    <div class="search-box" v-if="showSearch">
      <div class="search" :class="searchFocused ? 'is-focused' : ''">
        <Icon class="search-icon" icon="ph:magnifying-glass" width="17" height="17"/>
        <input
            ref="searchRef"
            v-model="keyword"
            class="search-input"
            type="text"
            spellcheck="false"
            :placeholder="$t('searchPlaceholder')"
            @focus="searchFocused = true"
            @blur="searchFocused = false"
            @keydown.esc="clearSearch"
        />
        <Icon v-if="keyword" class="search-clear" icon="ph:x-circle-fill" width="16" height="16"
              @click="clearSearch"/>
        <span v-else class="search-kbd">/</span>
      </div>
    </div>
    <div class="toolbar">
      <div class="icon-item search-toggle" v-if="showSearch" @click="focusSearch">
        <Icon icon="ph:magnifying-glass" width="19" height="19"/>
      </div>
      <div v-if="uiStore.dark" class="sun-icon icon-item" @click="openDark($event)">
        <Icon icon="mingcute:sun-fill"/>
      </div>
      <div v-else class="dark-icon icon-item" @click="openDark($event)">
        <Icon icon="solar:moon-linear"/>
      </div>
      <div class="notice icon-item" @click="openNotice">
        <Icon icon="streamline-plump:announcement-megaphone"/>
      </div>
      <el-dropdown ref="userinfoRef" @visible-change="e => userInfoShow = e" :teleported="false" popper-class="detail-dropdown">
        <div class="avatar" @click="userInfoHide" >
          <div class="avatar-text">
            <div>{{ formatName(userStore.user.email) }}</div>
          </div>
          <Icon class="setting-icon" icon="mingcute:down-small-fill" width="24" height="24"/>
        </div>
        <template #dropdown>
          <div class="user-details">
            <div class="details-avatar">
              {{ formatName(userStore.user.email) }}
            </div>
            <div class="user-name">
              {{ userStore.user.name }}
            </div>
            <div class="detail-email" @click="copyEmail(userStore.user.email)">
              {{ userStore.user.email }}
            </div>
            <div class="detail-user-type">
              <el-tag>{{ userStore.user.role.name }}</el-tag>
            </div>
            <div class="action-info">
              <div>
                <span style="margin-right: 10px">{{ $t('sendCount') }}</span>
                <span style="margin-right: 10px">{{ $t('accountCount') }}</span>
              </div>
              <div>
                <div>
                  <span v-if="sendCount" style="margin-right: 5px">{{ sendCount }}</span>
                  <el-tag v-if="!hasPerm('email:send')">{{ sendType }}</el-tag>
                  <el-tag v-else>{{ sendType }}</el-tag>
                </div>
                <div>
                  <el-tag v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail">
                    {{ $t('disabled') }}
                  </el-tag>
                  <span v-else-if="accountCount && hasPerm('account:add')"
                        style="margin-right: 5px">{{ $t('totalUserAccount', {msg: accountCount}) }}</span>
                  <el-tag v-else-if="!accountCount && hasPerm('account:add')">{{ $t('unlimited') }}</el-tag>
                  <el-tag v-else-if="!hasPerm('account:add')">{{ $t('unauthorized') }}</el-tag>
                </div>
              </div>
            </div>
            <div class="logout">
              <el-button type="primary" :loading="logoutLoading" @click="clickLogout">{{ $t('logOut') }}</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import hanburger from '@/components/hamburger/index.vue'
import {logout} from "@/request/login.js";
import {Icon} from "@iconify/vue";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {useRoute} from "vue-router";
import {computed, ref, watch, onMounted, onBeforeUnmount} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {setExtend} from "@/utils/day.js"

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const logoutLoading = ref(false)
const userInfoShow = ref(false)
const userinfoRef = ref({})

/* ---------- Quick search over the currently loaded list ---------- */
const searchRef = ref(null)
const searchFocused = ref(false)
const keyword = ref('')

// Views that render an email list and therefore support filtering
const SEARCHABLE_VIEWS = ['email', 'send', 'draft', 'star', 'all-email']

const showSearch = computed(() => SEARCHABLE_VIEWS.includes(route.meta.name))

watch(keyword, (value) => {
  uiStore.searchKeyword = value
})

// Reset the filter whenever the user navigates to another view
watch(() => route.meta.name, () => {
  keyword.value = ''
  uiStore.searchKeyword = ''
})

function focusSearch() {
  searchRef.value?.focus()
}

function clearSearch() {
  keyword.value = ''
  searchRef.value?.blur()
}

// "/" focuses search, Escape clears it — skipped while typing elsewhere
function onGlobalKeydown(e) {
  const el = e.target
  const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)

  if (e.key === '/' && !typing && showSearch.value) {
    e.preventDefault()
    focusSearch()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  uiStore.searchKeyword = ''
})

const accountCount = computed(() => {
  return userStore.user.role.accountCount
})

const sendType = computed(() => {

  if (settingStore.settings.send === 1) {
    return t('disabled')
  }

  if (!hasPerm('email:send')) {
    return t('unauthorized')
  }

  if (userStore.user.role.sendType === 'ban') {
    return t('sendBanned')
  }

  if (userStore.user.role.sendType === 'internal') {
    return t('sendInternal')
  }

  if (!userStore.user.role.sendCount) {
    return t('unlimited')
  }

  if (userStore.user.role.sendType === 'day') {
    return t('daily')
  }

  if (userStore.user.role.sendType === 'count') {
    return t('total')
  }
})

const sendCount = computed(() => {


  if (!hasPerm('email:send')) {
    return null
  }

  if (userStore.user.role.sendType === 'ban') {
    return null
  }

  if (userStore.user.role.sendType === 'internal') {
    return null
  }

  if (!userStore.user.role.sendCount) {
    return null
  }

  if (settingStore.settings.send === 1) {
    return null
  }

  return userStore.user.sendCount + '/' + userStore.user.role.sendCount
})

function userInfoHide(e) {
    if (userInfoShow.value) {
        userinfoRef.value.handleClose()
    } else {
        userinfoRef.value.handleOpen()
    }
}

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true,
    })
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true,
    })
  }
}

function changeLang(lang) {
  setExtend(lang === 'en' ? 'en' : 'zh-cn')
  settingStore.lang = lang
}

function openNotice() {
  uiStore.showNotice()
}

function openDark(e) {

  const nextIsDark = !uiStore.dark
  const root = document.documentElement

  if (!document.startViewTransition) {
    switchDark(nextIsDark, root);
    return
  }

  const x = e.clientX
  const y = e.clientY

  const maxX = Math.max(x, window.innerWidth - x)
  const maxY = Math.max(y, window.innerHeight - y)
  const endRadius = Math.hypot(maxX, maxY)

  // 标记切换目标，供 CSS 选择器使用
  root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light')
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-end-radius', `${endRadius + 10}px`)

  const transition = document.startViewTransition(() => {
    switchDark(nextIsDark, root);
  })

  transition.finished.finally(() => {
    // 清理标记
    root.removeAttribute('data-theme-to')
  })
}

function switchDark(nextIsDark, root) {
  root.setAttribute('class', nextIsDark ? 'dark' : '')
  const metaTag = document.getElementById('theme-color-meta');
  const isMobile =  !window.matchMedia("(pointer: fine) and (hover: hover)").matches;
  metaTag.setAttribute('content', nextIsDark ? (isMobile ? '#141414' : '#000000') : (isMobile ? '#FFFFFF' : '#F1F1F1'));
  uiStore.dark = nextIsDark
}

function openSend() {
  uiStore.writerRef.open()
}

function changeAside() {
  uiStore.asideShow = !uiStore.asideShow
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem("token")
    router.replace('/login')
  }).finally(() => {
    logoutLoading.value = false
  })
}

function formatName(email) {
  return email[0]?.toUpperCase() || ''
}

</script>
<style>
.detail-dropdown {
  color: var(--el-text-color-primary) !important;
}
</style>
<style lang="scss" scoped>

:deep(.el-popper.is-pure) {
  border-radius: 6px;
}

.user-details {
  width: 250px;
  font-size: 14px;
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;

  .user-name {
    font-weight: bold;
    margin-top: 10px;
    padding-left: 20px;
    padding-right: 20px;
    width: 250px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
  }

  .detail-user-type {
    margin-top: 10px;
  }

  .action-info {
    width: 100%;
    display: grid;
    grid-template-columns: auto auto;
    margin-top: 10px;

    > div:first-child {
      display: grid;
      align-items: center;
      gap: 10px;
    }

    > div:last-child {
      display: grid;
      gap: 10px;
      text-align: center;

      > div {
        display: flex;
        align-items: center;
      }
    }
  }

  .detail-email {
    padding-left: 20px;
    padding-right: 20px;
    width: 250px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
    color: var(--regular-text-color);
    cursor: pointer;
  }

  .logout {
    margin-top: 20px;
    width: 100%;
    padding-left: 10px;
    padding-right: 10px;
    padding-bottom: 10px;

    .el-button {
      border-radius: 6px;
      height: 28px;
      width: 100%;
    }
  }

  .details-avatar {
    margin-top: 20px;
    height: 48px;
    width: 48px;
    background: linear-gradient(135deg, var(--el-color-primary), #4f46e5);
    color: #ffffff;
    border: none;
    font-size: 18px;
    font-weight: 600;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    box-shadow: var(--shadow-xs);
  }
}


.header {
  text-align: right;
  font-size: 12px;
  display: grid;
  height: 100%;
  gap: 12px;
  align-items: center;
  padding: 0 6px 0 0;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
}

.header.not-send {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

/* ---------- Compose ---------- */
.writer-box {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;

  .writer {
    height: 34px;
    padding: 0 14px;
    border-radius: var(--radius-pill);
    color: #ffffff;
    background: linear-gradient(135deg, var(--el-color-primary), #4f46e5);
    box-shadow: var(--shadow-xs);
    transition: box-shadow var(--dur-base) var(--ease-out),
    transform var(--spring-bounce-duration) var(--spring-bounce),
    filter var(--dur-fast) var(--ease-out);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;

    .writer-text {
      font-size: 13px;
      font-weight: 590;
      white-space: nowrap;
      letter-spacing: var(--tracking-body);
      @media (max-width: 900px) {
        display: none;
      }
    }

    @media (max-width: 900px) {
      width: 34px;
      padding: 0;
    }
  }

  &:hover .writer {
    box-shadow: var(--shadow-md);
    filter: brightness(1.06);
  }

  /* Press feedback fires on pointer-down and is deliberately faster than
     the release, which springs back with a touch of overshoot. */
  &:active .writer {
    transform: scale(0.94);
    transition-duration: 90ms;
    transition-timing-function: ease-out;
  }
}

/* ---------- Search ---------- */
.search-box {
  display: flex;
  justify-content: flex-start;
  min-width: 0;
  @media (max-width: 767px) {
    display: none;
  }
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 420px;
  height: 34px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  background: var(--base-fill);
  border: 1px solid transparent;
  color: var(--secondary-text-color);
  transition: background-color var(--dur-fast) var(--ease-out),
  border-color var(--dur-fast) var(--ease-out),
  box-shadow 220ms var(--ease-out);

  &:hover {
    background: var(--base-fill);
  }

  &.is-focused {
    background: var(--el-bg-color);
    border-color: var(--el-color-primary);
    box-shadow: var(--focus-ring);
  }

  .search-icon {
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    font-size: 13.5px;
    color: var(--el-text-color-primary);
    text-align: left;

    &::placeholder {
      color: var(--muted-text-color);
    }
  }

  .search-clear {
    flex-shrink: 0;
    cursor: pointer;
    color: var(--muted-text-color);
    transition: color var(--dur-fast) var(--ease-out);

    &:hover {
      color: var(--el-text-color-primary);
    }
  }

  .search-kbd {
    flex-shrink: 0;
    min-width: 18px;
    height: 18px;
    line-height: 17px;
    padding: 0 5px;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    color: var(--muted-text-color);
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 5px;
  }
}

.header-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  min-width: 0;
}

.breadcrumb-item {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: var(--tracking-title);
  color: var(--el-text-color-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 4px;

  .icon-item {
    align-self: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--regular-text-color);
    transition: background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out),
    transform var(--spring-duration) var(--spring);
  }

  .icon-item:hover {
    background: var(--base-fill);
    color: var(--el-text-color-primary);
  }

  .icon-item:active {
    transform: scale(0.88);
    background: var(--fill-pressed);
    transition-duration: 80ms;
    transition-timing-function: ease-out;
  }

  .search-toggle {
    display: none;
    @media (max-width: 767px) {
      display: flex;
    }
  }

  .notice {
    font-size: 21px;
  }

  .dark-icon {
    font-size: 19px;
  }

  .sun-icon {
    font-size: 22px;
  }

  .avatar {
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 3px 4px 3px 3px;
    margin-left: 4px;
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition: background-color var(--dur-fast) var(--ease-out),
    transform var(--spring-duration) var(--spring);

    &:hover {
      background: var(--base-fill);
    }

    &:active {
      transform: scale(0.93);
      transition-duration: 80ms;
      transition-timing-function: ease-out;
    }

    .avatar-text {
      background: linear-gradient(135deg, var(--el-color-primary), #4f46e5);
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      height: 28px;
      width: 28px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      border: none;
      text-transform: uppercase;
    }

    .setting-icon {
      position: static;
      color: var(--muted-text-color);
      flex-shrink: 0;
    }
  }

}

.el-tooltip__trigger:first-child:focus-visible {
  outline: unset;
}
</style>
