<template>
  <el-config-provider :locale="elLocale">
    <router-view />
  </el-config-provider>
</template>
<script setup>
import { useI18n } from "vue-i18n";
import { computed, watch } from "vue";
import {useSettingStore} from "@/store/setting.js";
const settingStore = useSettingStore()
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import ruRu from 'element-plus/es/locale/lang/ru';
import('@/icons/index.js')
const { locale } = useI18n()
locale.value = settingStore.lang
watch(() => settingStore.lang, () => locale.value = settingStore.lang)

// Element Plus ships its own translations for date pickers, pagination and
// confirm dialogs — keep them in step with the app language.
const elLocale = computed(() => {
  if (settingStore.lang === 'zh') return zhCn
  if (settingStore.lang === 'ru') return ruRu
  return null
})
</script>
