<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon class="logo-icon"><Notification /></el-icon>
          <span v-show="!sidebarCollapsed" class="logo-text">Webhook配置</span>
        </div>
      </div>

      <el-menu
        :default-active="$route.path"
        :collapse="sidebarCollapsed"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/groups">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>群组配置</template>
        </el-menu-item>

        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <el-menu-item index="/rules">
          <el-icon><Bullhorn /></el-icon>
          <template #title>规则配置</template>
        </el-menu-item>

        <el-menu-item index="/templates">
          <el-icon><Document /></el-icon>
          <template #title>模板配置</template>
        </el-menu-item>

        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <template #title>监控面板</template>
        </el-menu-item>

        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <div class="header">
        <div class="header-left">
          <el-button
            type="text"
            @click="toggleSidebar"
            class="sidebar-toggle"
          >
            <el-icon><Expand v-if="sidebarCollapsed" /><Fold v-else /></el-icon>
          </el-button>

          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown @command="handleAction">
            <span class="header-actions">
              <el-button type="text">
                <el-icon><Setting /></el-icon>
              </el-button>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="import">导入配置</el-dropdown-item>
                <el-dropdown-item command="export">导出配置</el-dropdown-item>
                <el-dropdown-item divided command="backup">备份配置</el-dropdown-item>
                <el-dropdown-item command="reset">重置配置</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="content">
        <router-view />
      </div>
    </div>

    <!-- 导入/导出对话框 -->
    <ImportExportDialog
      v-model="importExportVisible"
      :type="dialogType"
      @success="handleImportExportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
// 导入Element Plus图标
import {
  OfficeBuilding,
  User,
  Bullhorn,
  Document,
  Monitor,
  Setting,
  Expand,
  Fold,
  Download,
  Upload,
  CaretBottom
} from '@element-plus/icons-vue'
import ImportExportDialog from '@/components/ImportExportDialog.vue'

const route = useRoute()
const sidebarCollapsed = ref(false)
const importExportVisible = ref(false)
const dialogType = ref<'import' | 'export'>('import')

// 当前页面标题
const currentPageTitle = computed(() => {
  return route.meta?.title as string || '配置管理'
})

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 处理顶部操作
const handleAction = (command: string) => {
  switch (command) {
    case 'import':
      dialogType.value = 'import'
      importExportVisible.value = true
      break
    case 'export':
      dialogType.value = 'export'
      importExportVisible.value = true
      break
    case 'backup':
      handleBackup()
      break
    case 'reset':
      handleReset()
      break
  }
}

// 备份配置
const handleBackup = async () => {
  try {
    const { configManager } = await import('@/utils/config-manager')
    configManager.backupConfig()
    ElMessage.success('配置备份成功')
  } catch (error) {
    ElMessage.error('配置备份失败')
  }
}

// 重置配置
const handleReset = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清空所有配置数据，是否继续？',
      '重置配置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const { configManager } = await import('@/utils/config-manager')
    configManager.clearAllConfig()
    location.reload()
  } catch {
    // 用户取消操作
  }
}

// 导入导出成功回调
const handleImportExportSuccess = () => {
  importExportVisible.value = false
  // 重新加载页面数据
  location.reload()
}
</script>

<style scoped lang="scss">
.layout-container {
  display: flex;
  height: 100vh;
  background-color: $bg-color;
}

.sidebar {
  width: $sidebar-width;
  background: $bg-color-page;
  border-right: 1px solid $border-color-lighter;
  transition: width 0.3s;
  overflow: hidden;

  &.sidebar-collapsed {
    width: $sidebar-collapsed-width;
  }
}

.sidebar-header {
  height: $header-height;
  display: flex;
  align-items: center;
  padding: 0 $spacing-lg;
  border-bottom: 1px solid $border-color-lighter;
}

.logo {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .logo-icon {
    font-size: 24px;
    color: $primary-color;
  }

  .logo-text {
    font-size: $font-size-large;
    font-weight: 600;
    color: $text-color-primary;
    white-space: nowrap;
  }
}

.sidebar-menu {
  border: none;

  .el-menu-item {
    margin: $spacing-xs $spacing-sm;
    border-radius: $border-radius-base;

    &:hover {
      background-color: rgba(64, 158, 255, 0.1);
    }

    &.is-active {
      background-color: $primary-color;
      color: white;

      .el-icon {
        color: white;
      }
    }
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: $header-height;
  background: $bg-color-page;
  border-bottom: 1px solid $border-color-lighter;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-lg;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.sidebar-toggle {
  font-size: 18px;
  color: $text-color-regular;

  &:hover {
    color: $primary-color;
  }
}

.breadcrumb {
  font-size: $font-size-base;
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.header-actions {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: $text-color-regular;

  &:hover {
    color: $primary-color;
  }
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
}
</style>