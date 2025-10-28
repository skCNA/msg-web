<template>
  <div class="users-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">用户管理</h2>
        <p class="page-description">管理系统中的用户信息和通知配置</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          添加用户
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户姓名、邮箱..."
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="statusFilter"
          placeholder="用户状态"
          style="width: 120px"
          clearable
          @change="handleFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="活跃" value="active" />
          <el-option label="停用" value="inactive" />
        </el-select>

        <el-select
          v-model="roleFilter"
          placeholder="用户角色"
          style="width: 120px"
          clearable
          @change="handleFilter"
        >
          <el-option label="全部" value="" />
          <el-option label="管理员" value="系统管理员" />
          <el-option label="运维工程师" value="运维工程师" />
          <el-option label="开发工程师" value="开发工程师" />
          <el-option label="测试工程师" value="测试工程师" />
        </el-select>
      </div>

      <div class="filter-right">
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出用户
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入用户
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-value">{{ usersStore.userCount }}</div>
        <div class="stat-label">总用户数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ usersStore.activeUserCount }}</div>
        <div class="stat-label">活跃用户</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ getFeishuUsersCount() }}</div>
        <div class="stat-label">飞书用户</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ getWechatUsersCount() }}</div>
        <div class="stat-label">企业微信用户</div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="users-table">
      <el-table
        v-loading="usersStore.loading"
        :data="filteredUsers"
        style="width: 100%"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="用户信息" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" class="user-avatar">
                {{ row.name.charAt(0) }}
              </el-avatar>
              <div class="user-details">
                <div class="user-name">{{ row.name }}</div>
                <div class="user-email">{{ row.email || '未设置邮箱' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="部门角色" width="150">
          <template #default="{ row }">
            <div class="role-info">
              <div class="department">{{ row.department || '未设置部门' }}</div>
              <el-tag size="small" type="info">{{ row.role }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="飞书配置" width="120">
          <template #default="{ row }">
            <div class="platform-config">
              <el-icon v-if="row.feishu_user_id" color="#67C23A">
                <Check />
              </el-icon>
              <el-icon v-else color="#F56C6C">
                <Close />
              </el-icon>
              <span class="config-text">
                {{ row.feishu_user_id ? '已配置' : '未配置' }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="企业微信配置" width="120">
          <template #default="{ row }">
            <div class="platform-config">
              <el-icon v-if="row.wechat_user_id" color="#67C23A">
                <Check />
              </el-icon>
              <el-icon v-else color="#F56C6C">
                <Close />
              </el-icon>
              <span class="config-text">
                {{ row.wechat_user_id ? '已配置' : '未配置' }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="联系方式" width="140">
          <template #default="{ row }">
            <div class="contact-info">
              <div v-if="row.phone" class="phone">
                <el-icon><Phone /></el-icon>
                {{ row.phone }}
              </div>
              <div v-else class="no-contact">未设置手机号</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.active ? 'success' : 'danger'" size="small">
              {{ row.active ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="text" size="small" @click="editUser(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="text" size="small" @click="testUserMention(row)">
                <el-icon><ChatDotRound /></el-icon>
                测试@功能
              </el-button>
              <el-dropdown @command="(cmd) => handleUserAction(cmd, row)">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="toggle">
                      {{ row.active ? '停用' : '启用' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制用户</el-dropdown-item>
                    <el-dropdown-item divided command="delete" class="danger-item">
                      删除用户
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredUsers.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="filteredUsers.length === 0 && !usersStore.loading"
      description="暂无用户数据"
      :image-size="120"
    >
      <el-button type="primary" @click="showCreateDialog = true">
        添加第一个用户
      </el-button>
    </el-empty>

    <!-- 用户对话框 -->
    <UserDialog
      v-model="showCreateDialog"
      :user="editingUser"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 导入Element Plus图标
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Check,
  Close,
  Phone,
  ChatDotRound,
  MoreFilled
} from '@element-plus/icons-vue'
import type { User } from '@/types'
import { useUsersStore } from '@/stores/users'
import UserDialog from '@/components/UserDialogSimple.vue'

const usersStore = useUsersStore()

const searchKeyword = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const selectedUsers = ref<User[]>([])

const showCreateDialog = ref(false)
const editingUser = ref<User | null>(null)

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let users = usersStore.users

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    users = users.filter(user =>
      user.name.toLowerCase().includes(keyword) ||
      (user.email && user.email.toLowerCase().includes(keyword)) ||
      (user.phone && user.phone.includes(keyword))
    )
  }

  // 状态筛选
  if (statusFilter.value) {
    const isActive = statusFilter.value === 'active'
    users = users.filter(user => user.active === isActive)
  }

  // 角色筛选
  if (roleFilter.value) {
    users = users.filter(user => user.role === roleFilter.value)
  }

  return users
})

// 分页后的用户列表
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

// 获取飞书用户数量
const getFeishuUsersCount = () => {
  return usersStore.users.filter(user => user.feishu_user_id).length
}

// 获取企业微信用户数量
const getWechatUsersCount = () => {
  return usersStore.users.filter(user => user.wechat_user_id).length
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 选择处理
const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection
}

// 编辑用户
const editUser = (user: User) => {
  editingUser.value = user
  showCreateDialog.value = true
}

// 测试用户@功能
const testUserMention = async (user: User) => {
  const platform = user.feishu_user_id ? '飞书' :
                   user.wechat_user_id ? '企业微信' : null

  if (!platform) {
    ElMessage.warning('用户未配置任何平台账号')
    return
  }

  const userId = user.feishu_user_id || user.wechat_user_id
  ElMessage.info(`测试@功能：发送测试消息到${platform}用户 ${user.name} (${userId})`)
  // 这里可以实现真实的@功能测试
}

// 处理用户操作
const handleUserAction = async (command: string, user: User) => {
  switch (command) {
    case 'toggle':
      await toggleUserStatus(user)
      break
    case 'duplicate':
      await duplicateUser(user)
      break
    case 'delete':
      await deleteUser(user)
      break
  }
}

// 切换用户状态
const toggleUserStatus = async (user: User) => {
  try {
    await usersStore.toggleUserStatus(user.id)
    ElMessage.success(`用户已${user.active ? '停用' : '启用'}`)
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 复制用户
const duplicateUser = async (user: User) => {
  try {
    const newUserData = {
      ...user,
      name: `${user.name} (副本)`
    }
    delete (newUserData as any).id
    delete (newUserData as any).created_at

    await usersStore.addUser(newUserData as Omit<User, 'id' | 'created_at'>)
    ElMessage.success('用户复制成功')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 删除用户
const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await usersStore.deleteUser(user.id)
    ElMessage.success('用户删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 导出用户
const handleExport = () => {
  const users = selectedUsers.value.length > 0 ? selectedUsers.value : usersStore.users
  const csvContent = generateCSV(users)
  downloadCSV(csvContent, 'users.csv')
  ElMessage.success('用户导出成功')
}

// 导入用户
const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

// 生成CSV内容
const generateCSV = (users: User[]) => {
  const headers = ['姓名', '邮箱', '手机号', '部门', '角色', '飞书ID', '企业微信ID', '状态', '创建时间']
  const rows = users.map(user => [
    user.name,
    user.email || '',
    user.phone || '',
    user.department || '',
    user.role,
    user.feishu_user_id || '',
    user.wechat_user_id || '',
    user.active ? '活跃' : '停用',
    new Date(user.created_at).toLocaleString()
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// 下载CSV文件
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 对话框成功回调
const handleDialogSuccess = () => {
  showCreateDialog.value = false
  editingUser.value = null
}

// 页面加载
onMounted(async () => {
  await usersStore.loadUsers()
})
</script>

<style scoped lang="scss">
.users-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-xl;

  .page-title {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-extra-large;
    color: $text-color-primary;
  }

  .page-description {
    margin: 0;
    color: $text-color-secondary;
    font-size: $font-size-base;
  }
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $bg-color-page;
  border-radius: $border-radius-base;
  border: 1px solid $border-color-lighter;

  .filter-left {
    display: flex;
    gap: $spacing-md;
  }

  .filter-right {
    display: flex;
    gap: $spacing-sm;
  }
}

.stats-row {
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;

  .stat-item {
    flex: 1;
    background: $bg-color-page;
    border-radius: $border-radius-base;
    border: 1px solid $border-color-lighter;
    padding: $spacing-lg;
    text-align: center;

    .stat-value {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $primary-color;
      margin-bottom: $spacing-xs;
    }

    .stat-label {
      font-size: $font-size-small;
      color: $text-color-secondary;
    }
  }
}

.users-table {
  background: $bg-color-page;
  border-radius: $border-radius-base;
  border: 1px solid $border-color-lighter;
  overflow: hidden;

  .user-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    .user-avatar {
      background: $primary-color;
      color: white;
      font-weight: 600;
    }

    .user-details {
      .user-name {
        font-weight: 600;
        color: $text-color-primary;
        margin-bottom: $spacing-xs;
      }

      .user-email {
        font-size: $font-size-small;
        color: $text-color-secondary;
      }
    }
  }

  .role-info {
    .department {
      font-size: $font-size-small;
      color: $text-color-secondary;
      margin-bottom: $spacing-xs;
    }
  }

  .platform-config {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    .config-text {
      font-size: $font-size-small;
    }
  }

  .contact-info {
    .phone {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      font-size: $font-size-small;
      color: $text-color-regular;
    }

    .no-contact {
      font-size: $font-size-small;
      color: $text-color-secondary;
    }
  }

  .action-buttons {
    display: flex;
    gap: $spacing-xs;
  }

  .danger-item {
    color: $danger-color;
  }
}

.pagination-wrapper {
  padding: $spacing-lg;
  display: flex;
  justify-content: center;
  border-top: 1px solid $border-color-lighter;
}
</style>