<template>
  <div class="account-box">
    <div class="head-opt">
      <span class="head-label">{{ $t('emailAccount') }}</span>
      <div class="head-actions">
        <Icon v-perm="'account:add'" class="icon add" icon="ion:add-outline" width="19" height="19" @click="add"/>
        <Icon class="icon refresh" icon="ion:reload" width="15" height="15" @click="refresh"/>
      </div>
    </div>
    <el-scrollbar class="scrollbar" ref="scrollbarRef">
      <div v-infinite-scroll="getAccountList" :infinite-scroll-distance="600" :infinite-scroll-immediate="false">
        <div class="item" :class="itemBg(item.accountId)" v-for="(item, index) in accounts" :key="item.accountId"
             @click="changeAccount(item)">
          <div class="item-avatar" :style="avatarStyle(item.email)">
            {{ avatarText('', item.email) }}
          </div>
          <div class="item-body">
            <div class="account">{{ item.email }}</div>
            <div class="item-meta">
              <span class="mode-chip" @click.stop="setAllReceive(item)">
                <Icon v-if="!item.allReceive" icon="eva:email-fill" width="13" height="13"/>
                <Icon v-else icon="flat-color-icons:folder" width="13" height="13"/>
                <span>{{ item.allReceive ? $t('allMail') : $t('inbox') }}</span>
              </span>
            </div>
          </div>
          <div class="item-actions" @click.stop>
            <span class="act" @click.stop="copyAccount(item.email)">
              <Icon icon="ph:copy" width="15" height="15"/>
            </span>
            <span class="act is-muted" v-if="showNullSetting(item)">
              <Icon icon="ph:dots-three-outline-fill" width="15" height="15"/>
            </span>
            <el-dropdown v-else trigger="click">
              <span class="act">
                <Icon icon="ph:dots-three-outline-fill" width="15" height="15"/>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="hasPerm('email:send')" @click="openSetName(item)">{{ $t('rename') }}</el-dropdown-item>
                  <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId" @click="setAsTop(item, index)">{{ $t('pin') }}</el-dropdown-item>
                  <el-dropdown-item v-if="item.accountId !== userStore.user.account.accountId && hasPerm('account:delete')"
                                    @click="remove(item)">{{ $t('delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- Initial Loading Skeleton -->
        <template v-if="loading">
          <el-skeleton v-for="i in skeletonRows" :key="i" animated>
            <template #template>
              <div class="item skeleton-item">
                <el-skeleton-item variant="circle" style="width: 30px; height: 30px"/>
                <div style="display: grid; gap: 6px">
                  <el-skeleton-item variant="p" style="width: 75%; height: 12px"/>
                  <el-skeleton-item variant="text" style="width: 40%; height: 9px"/>
                </div>
              </div>
            </template>
          </el-skeleton>
        </template>

        <!-- Follow Loading Skeleton -->
        <template v-if="accounts.length > 0 && !noLoading">
          <el-skeleton animated>
            <template #template>
              <el-card class="item">
                <el-skeleton-item variant="p" style="width: 70%; height: 20px; margin-bottom: 20px"/>
                <div style="display: flex; justify-content: space-between">
                  <el-skeleton-item variant="text" style="width: 20px"/>
                  <el-skeleton-item variant="text" style="width: 20px"/>
                </div>
              </el-card>
            </template>
          </el-skeleton>
        </template>

        <div class="noLoading" v-if="noLoading && accounts.length > 0">
          <div>{{ $t('noMoreData') }}</div>
        </div>
        <div class="empty" v-if="noLoading && accounts.length === 0">
          <el-empty :description="$t('noMessagesFound')"/>
        </div>
      </div>

    </el-scrollbar>
    <el-dialog v-model="showAdd" :title="$t('addAccount')">
      <div class="container">
        <el-input v-model="addForm.email" ref="addRef" type="text" :placeholder="$t('emailAccount')" autocomplete="off">
          <template #append>
            <div @click.stop="openSelect">
              <el-select
                  ref="mySelect"
                  v-model="addForm.suffix"
                  :placeholder="$t('select')"
                  class="select"
              >
                <el-option
                    v-for="item in domainList"
                    :key="item"
                    :label="item"
                    :value="item"
                />
              </el-select>
              <div>
                <span>{{ addForm.suffix }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-button class="btn" type="primary" @click="submit" :loading="addLoading"
        >{{ $t('add') }}
        </el-button>
      </div>
      <div
          class="add-email-turnstile"
          :class="verifyShow ? 'turnstile-show' : 'turnstile-hide'"
          :data-sitekey="settingStore.settings.siteKey"
          data-callback="onTurnstileSuccess"
          data-error-callback="onTurnstileError"
      >
        <span style="font-size: 12px;color: #F56C6C" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
      </div>
    </el-dialog>
    <el-dialog v-model="setNameShow" :title="$t('changeUserName')">
      <div class="container">
        <el-input v-model="accountName" type="text" :placeholder="$t('username')" autocomplete="off">
        </el-input>
        <el-button class="btn" type="primary" @click="setName" :loading="setNameLoading"
        >{{ $t('save') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import {Icon} from "@iconify/vue";
import {computed, nextTick, reactive, ref, watch} from "vue";
import {
  accountList,
  accountAdd,
  accountDelete,
  accountSetName,
  accountSetAllReceive,
  accountSetAsTop
} from "@/request/account.js";
import {sleep} from "@/utils/time-utils.js"
import {avatarStyle, avatarText} from "@/utils/avatar.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {useUserStore} from "@/store/user.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {AccountAllReceiveEnum} from "@/enums/account-enum.js";

const {t} = useI18n();
const userStore = useUserStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const emailStore = useEmailStore();
const showAdd = ref(false)
const addLoading = ref(false);
const domainList = computed(() => settingStore.domainList)
const accounts = reactive([])
const noLoading = ref(false)
const loading = ref(false)
const followLoading = ref(false);
const verifyShow = ref(false)
const setNameShow = ref(false)
const setNameLoading = ref(false)
const accountName = ref(null)
const addRef = ref({})
const scrollbarRef = ref({})
let account = null
let turnstileId = null
const botJsError = ref(false)
let verifyToken = ''
let verifyErrorCount = 0
let first = true
const addForm = reactive({
  email: '',
  suffix: settingStore.domainList[0]
})
let skeletonRows = 10
const queryParams = {
  size: 30
}

const mySelect = ref()

if (hasPerm('account:query')) {
  getAccountList()
}

watch(() => accountStore.changeUserAccountName, () => {
  accounts[0].name = accountStore.changeUserAccountName
})

watch(() => settingStore.domainList, (list) => {
  if (!addForm.suffix && list.length > 0) {
    addForm.suffix = list[0]
  }
}, {immediate: true})


const openSelect = () => {
  mySelect.value.toggleMenu()
}

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) {
    return
  }
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.add-email-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

function getSkeletonRows() {
  if (accounts.length > 20) return skeletonRows = 20
  if (accounts.length === 0) return skeletonRows = 1
  skeletonRows = accounts.length
}

function setName() {

  let name = accountName.value

  if (name === account.name) {
    setNameShow.value = false
    return
  }

  if (!name) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameLoading.value = true
  accountSetName(account.accountId, name).then(() => {
    account.name = name
    setNameShow.value = false

    if (account.accountId === userStore.user.account.accountId) {
      userStore.user.name = name
    }

    ElMessage({
      message: t('saveSuccessMsg'),
      type: "success",
      plain: true
    })
  }).finally(() => {
    setNameLoading.value = false
  })
}

function openSetName(accountItem) {
  accountName.value = accountItem.name
  account = accountItem
  setNameShow.value = true
}

function setAllReceive(account) {
  let allReceiveAccount = accounts.find(account => account.allReceive === AccountAllReceiveEnum.ENABLED);
  if (allReceiveAccount && allReceiveAccount.accountId !== account.accountId) allReceiveAccount.allReceive = AccountAllReceiveEnum.DISABLED;
  account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
  accountSetAllReceive(account.accountId).catch(() => {
    account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
    if (allReceiveAccount) allReceiveAccount.allReceive = AccountAllReceiveEnum.ENABLED;
  }).then(() => {
    if (account.allReceive === AccountAllReceiveEnum.ENABLED) {
      ElMessage({
        message: t('setSuccess'),
        type: 'success',
        plain: true,
      })
    }
    changeAccount(account);
    emailStore.emailScroll?.refreshList();
    emailStore.sendScroll?.refreshList();
  })
}


function showNullSetting(item) {
  return !hasPerm('email:send') && !(item.accountId !== userStore.user.account.accountId && hasPerm('account:delete'))
}

function itemBg(accountId) {
  return accountStore.currentAccountId === accountId ? 'item-choose' : ''
}



function remove(account) {
  ElMessageBox.confirm(t('delConfirm', {msg: account.email}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    accountDelete(account.accountId).then(() => {
      const index = accounts.findIndex(item => item.accountId === account.accountId);
      accounts.splice(index, 1);
      if (accounts.length < queryParams.size) {
        getAccountList()
      }
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  });
}

function refresh() {
  if (loading.value) {
    return
  }
  loading.value = false
  followLoading.value = false
  noLoading.value = false
  queryParams.accountId = 0
  queryParams.lastSort = null
  getSkeletonRows();
  scrollbarRef.value.setScrollTop(0)
  accounts.splice(0, accounts.length)
  getAccountList()
}

function changeAccount(account) {
  accountStore.currentAccountId = account.accountId
  accountStore.currentAccount = account
}

function add() {
  addForm.suffix = addForm.suffix || settingStore.domainList[0]
  showAdd.value = true
  setTimeout(() => {
    addRef.value.focus()
  }, 100)
}

function setAsTop(account, index) {
  accountSetAsTop(account.accountId).then(() => {
    ElMessage({
      message: t('setSuccess'),
      type: 'success',
      plain: true,
    })

    const [item] = accounts.splice(index, 1);
    accounts.splice(1, 0, item);

  });
}

async function copyAccount(account) {
  try {
    await navigator.clipboard.writeText(account);
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

function getAccountList() {

  if (loading.value || followLoading.value || noLoading.value) return;

  if (accounts.length === 0) {
    loading.value = true
  } else {
    followLoading.value = true
  }

  let start = Date.now();

  const accountId = accounts.length > 0 ? accounts.at(-1).accountId : 0;
  const lastSort = accounts.length > 0 ? accounts.at(-1).sort : null;

  accountList(accountId, queryParams.size, lastSort).then(async list => {

    let end = Date.now();
    let duration = end - start;
    if (duration < 300) {
      await sleep(300 - duration)
    }

    if (list.length < queryParams.size) {
      noLoading.value = true
    }
    if (accounts.length === 0) {
      accountStore.currentAccount = list[0]
    }

    accounts.push(...list)

    loading.value = false
    followLoading.value = false
    first = false
  }).catch(() => {
    loading.value = false
    followLoading.value = false
  })
}


function submit() {

  if (!addForm.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (addForm.email.length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!isEmail(addForm.email + addForm.suffix)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (!verifyToken && (settingStore.settings.addEmailVerify === 0 || (settingStore.settings.addEmailVerify === 2 && settingStore.settings.addVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.add-email-turnstile')
          } catch (e) {
            botJsError.value = true
            console.log('人机验证js加载失败')
          }
        } else {
          window.turnstile.reset('.add-email-turnstile')
        }
      })
    } else if (!botJsError.value) {
      ElMessage({
        message: t('botVerifyMsg'),
        type: "error",
        plain: true
      })
    }
    return;
  }

  addLoading.value = true
  accountAdd(addForm.email + addForm.suffix, verifyToken).then(account => {
    addLoading.value = false
    showAdd.value = false
    addForm.email = ''
    accounts.push(account)
    verifyToken = ''
    settingStore.settings.addVerifyOpen = account.addVerifyOpen
    ElMessage({
      message: t('addSuccessMsg'),
      type: "success",
      plain: true
    })
    verifyShow.value = false
    userStore.refreshUserInfo()
  }).catch(res => {
    if (res.code === 400) {
      verifyToken = ''
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.add-email-turnstile')
        })
      }
      verifyShow.value = true
    }
    addLoading.value = false
  })
}
</script>
<style>
path[fill="#ffdda1"] {
  fill: #ffdd7d;
}
</style>
<style scoped lang="scss">
.account-box {

  position: relative;
  border-right: none !important;
  box-shadow: inset -0.5px 0 0 0 var(--hairline);
  background-color: var(--el-bg-color);
  height: 100%;
  overflow: hidden;

  /* Floating translucent chrome: the list scrolls underneath it, and a soft
     scroll edge marks the overlap instead of a hard divider. */
  .head-opt {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 42px;
    background: var(--material-thin);
    -webkit-backdrop-filter: var(--blur-thin);
    backdrop-filter: var(--blur-thin);
    box-shadow: var(--material-edge);
    padding: 0 8px 0 14px;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 100%;
      height: 12px;
      pointer-events: none;
      background: linear-gradient(to bottom, var(--material-thin), transparent);
      -webkit-mask-image: linear-gradient(to bottom, #000, transparent);
      mask-image: linear-gradient(to bottom, #000, transparent);
    }

    .head-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted-text-color);
      user-select: none;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .head-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }

    .icon {
      cursor: pointer;
      width: 26px;
      height: 26px;
      padding: 4px;
      border-radius: var(--radius-xs);
      color: var(--secondary-text-color);
      transition: background-color var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);

      &:hover {
        background: var(--base-fill);
        color: var(--el-text-color-primary);
      }
    }
  }

  .scrollbar {
    width: 100%;
    /* Full height — content passes beneath the floating header */
    height: 100%;
    overflow: auto;
    @media (max-width: 767px) {
      height: calc(100% - 56px);
    }

    .empty {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .noLoading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px 0;
      color: var(--secondary-text-color);
    }
  }

  .btn {
    width: 100%;
    margin-top: 15px;
  }

  /* ---------- Account row ---------- */
  .item {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 8px 8px 8px 10px;
    margin: 0 8px 2px;
    cursor: pointer;
    transition: background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    transform var(--spring-duration) var(--spring);

    /* Instant, on press — not on release */
    &:active {
      transform: scale(0.978);
      background: var(--fill-pressed);
      transition-duration: 90ms;
      transition-timing-function: ease-out;
    }

    .item-avatar {
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
      box-shadow: inset 0 0 0 1px var(--avatar-ring);
      user-select: none;
    }

    .item-body {
      min-width: 0;
    }

    .account {
      font-weight: 550;
      font-size: 13.5px;
      line-height: 1.35;
      color: var(--el-text-color-primary);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .item-meta {
      margin-top: 1px;

      .mode-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11.5px;
        line-height: 1.4;
        color: var(--secondary-text-color);
        border-radius: var(--radius-xs);
        padding: 0 3px;
        margin-left: -3px;
        transition: background-color var(--dur-fast) var(--ease-out),
        color var(--dur-fast) var(--ease-out);

        &:hover {
          background: var(--base-fill);
          color: var(--el-text-color-primary);
        }
      }
    }

    /* Row actions stay hidden until the row is hovered or active */
    .item-actions {
      display: flex;
      align-items: center;
      gap: 1px;
      opacity: 0;
      transition: opacity var(--dur-fast) var(--ease-out);

      .act {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: var(--radius-xs);
        color: var(--secondary-text-color);
        cursor: pointer;
        transition: background-color var(--dur-fast) var(--ease-out),
        color var(--dur-fast) var(--ease-out),
        transform var(--spring-duration) var(--spring);

        &:hover {
          background: var(--base-fill);
          color: var(--el-text-color-primary);
        }

        &:active {
          transform: scale(0.9);
          background: var(--fill-pressed);
          transition-duration: 80ms;
          transition-timing-function: ease-out;
        }

        &.is-muted {
          opacity: 0.35;
          pointer-events: none;
        }
      }
    }

    &:hover {
      background: var(--email-hover-background);

      .item-actions {
        opacity: 1;
      }
    }

    /* Touch devices have no hover — always show the actions */
    @media (pointer: coarse) {
      .item-actions {
        opacity: 1;
      }
    }
  }

  /* Clears the floating header so the first row starts below it */
  .item:first-child {
    margin-top: 50px;
  }

  .skeleton-item {
    grid-template-columns: auto minmax(0, 1fr);
    cursor: default;

    &:hover {
      background: transparent;
    }
  }

  .item-choose {
    background: var(--choose-account-background) !important;
    border-color: var(--choose-account-border);

    .account {
      font-weight: 650;
    }

    .item-actions {
      opacity: 1;
    }
  }
}


.setting-icon {
  position: relative;
  top: 6px;
}

:deep(.el-input-group__append) {
  padding: 0 !important;
  padding-left: 8px !important;
  background: var(--el-bg-color);
}

:deep(.el-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.select {
  position: absolute;
  right: 30px;
  width: 100px;
  opacity: 0;
  pointer-events: none;
}

:deep(.el-pagination .el-select) {
  width: 100px;
  background: var(--el-bg-color);
}

.add-email-turnstile {
  margin-top: 15px;
}

.turnstile-show {
  opacity: 1;
}

.turnstile-hide {
  opacity: 0;
  pointer-events: none;
  position: fixed;
}

</style>
