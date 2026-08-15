<template>
  <el-scrollbar class="scroll">
    <div class="aside-inner">
      <div class="brand">
        <div class="brand-mark">
          <Icon icon="mdi:email-outline" width="19" height="19"/>
        </div>
        <div class="brand-name">{{ settingStore.settings.title }}</div>
      </div>

      <el-menu :collapse="false" text-color="var(--aside-text)" active-text-color="var(--aside-active-text)"
               class="nav">
        <el-menu-item @click="router.push({name: 'email'})" index="email"
                      :class="route.meta.name === 'email' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="hugeicons:mailbox-01" width="19" height="19"/>
          <span class="menu-name">{{ $t('inbox') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'send'})" index="send" v-perm="'email:send'"
                      :class="route.meta.name === 'send' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="cil:send" width="18" height="18"/>
          <span class="menu-name">{{ $t('sent') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'draft'})" index="draft" v-perm="'email:send'"
                      :class="route.meta.name === 'draft' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="ep:document" width="18" height="18"/>
          <span class="menu-name">{{ $t('drafts') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'star'})" index="star"
                      :class="route.meta.name === 'star' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="solar:star-line-duotone" width="19" height="19"/>
          <span class="menu-name">{{ $t('starred') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'setting'})" index="setting"
                      :class="route.meta.name === 'setting' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="fluent:settings-48-regular" width="19" height="19"/>
          <span class="menu-name">{{ $t('settings') }}</span>
        </el-menu-item>

        <div class="manage-title"
             v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
          <span>{{ $t('manage') }}</span>
        </div>

        <el-menu-item @click="router.push({name: 'analysis'})" index="analysis" v-perm="'analysis:query'"
                      :class="route.meta.name === 'analysis' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="fluent:data-pie-20-regular" width="20" height="20"/>
          <span class="menu-name">{{ $t('analytics') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'user'})" index="user" v-perm="'user:query'"
                      :class="route.meta.name === 'user' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="si:user-alt-2-line" width="18" height="18"/>
          <span class="menu-name">{{ $t('allUsers') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'all-email'})" index="all-email" v-perm="'all-email:query'"
                      :class="route.meta.name === 'all-email' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="fluent:mail-list-28-regular" width="20" height="20"/>
          <span class="menu-name">{{ $t('allMail') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'role'})" index="role" v-perm="'role:query'"
                      :class="route.meta.name === 'role' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="fluent:lock-closed-16-regular" width="20" height="20"/>
          <span class="menu-name">{{ $t('permissions') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'reg-key'})" index="reg-key" v-perm="'reg-key:query'"
                      :class="route.meta.name === 'reg-key' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="fluent:fingerprint-20-filled" width="20" height="20"/>
          <span class="menu-name">{{ $t('inviteCode') }}</span>
        </el-menu-item>
        <el-menu-item @click="router.push({name: 'sys-setting'})" index="sys-setting" v-perm="'setting:query'"
                      :class="route.meta.name === 'sys-setting' ? 'choose-item' : ''">
          <Icon class="nav-icon" icon="eos-icons:system-ok-outlined" width="17" height="17"/>
          <span class="menu-name">{{ $t('SystemSettings') }}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </el-scrollbar>
</template>

<script setup>
import router from "@/router/index.js";
import { useRoute } from "vue-router";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";

const settingStore = useSettingStore();
const route = useRoute();

</script>

<style lang="scss" scoped>

.aside-inner {
  padding-bottom: 12px;
}

/* ---------- Brand ---------- */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 60px;
  padding: 0 16px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--aside-divider);

  .brand-mark {
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: linear-gradient(135deg, var(--el-color-primary), #4f46e5);
    box-shadow: var(--shadow-xs);
  }

  .brand-name {
    font-size: 15px;
    font-weight: 600;
    /* Large text reads too loose as it grows — tighten it */
    letter-spacing: var(--tracking-title);
    color: var(--aside-text-strong);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
  }
}

/* ---------- Section label ---------- */
.manage-title {
  margin: 16px 0 6px;
  padding: 0 20px;
  font-size: 11px;
  font-weight: 600;
  /* Small text wants a touch of positive tracking to stay legible */
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--aside-section-label);
  user-select: none;
}

/* ---------- Nav items ---------- */
.el-menu-item {
  margin: 2px 10px !important;
  border-radius: var(--radius-sm);
  height: 38px;
  line-height: 38px;
  padding: 0 12px !important;
  font-size: 14px;
  /* Vibrancy: slightly heavier over a translucent surface */
  font-weight: 510;
  letter-spacing: var(--tracking-body);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  transition: background-color var(--dur-fast) var(--ease-out),
  color var(--dur-fast) var(--ease-out),
  transform var(--spring-duration) var(--spring);
}

.nav-icon {
  flex-shrink: 0;
  width: 20px;
  opacity: 0.85;
  transition: opacity var(--dur-fast) var(--ease-out);
}

.menu-name {
  user-select: none;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Active state: tinted surface + accent rail on the left */
.choose-item {
  font-weight: 600;
  color: var(--aside-active-text) !important;
  background: var(--aside-active-bg) !important;

  .nav-icon {
    opacity: 1;
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 18px;
    border-radius: 0 var(--radius-pill) var(--radius-pill) 0;
    background: var(--el-color-primary);
  }
}

@media (hover: hover) {
  .el-menu-item:hover {
    background: var(--aside-hover) !important;
    color: var(--aside-text-strong);
  }

  .el-menu-item:hover .nav-icon {
    opacity: 1;
  }

  .choose-item:hover {
    background: var(--aside-active-bg) !important;
    color: var(--aside-active-text) !important;
  }
}

/* Highlight the instant it is pressed — waiting for the click feels dead */
.el-menu-item:active {
  transform: scale(0.975);
  background: var(--fill-pressed) !important;
  transition-duration: 90ms;
  transition-timing-function: ease-out;
}

/* ---------- Surfaces ---------- */
/* Nothing inside re-paints the material — the layer owns the background */
:deep(.el-scrollbar__wrap--hidden-default) {
  background: transparent !important;
}

:deep(.el-menu-item) {
  background: transparent;
}

:deep(.el-menu) {
  background: transparent;
}

.el-menu {
  border-right: 0;
  width: 260px;
}

:deep(.el-divider__text) {
  background: var(--aside-backgound);
  color: var(--aside-text);
}

/* The sidebar is the heaviest material in the layout — heavier materials
   separate structural regions, lighter ones carry interactive chrome. */
.scroll {
  background: var(--aside-backgound);
  -webkit-backdrop-filter: var(--blur-thick);
  backdrop-filter: var(--blur-thick);
  box-shadow: inset -0.5px 0 0 0 var(--aside-divider);
}
</style>
