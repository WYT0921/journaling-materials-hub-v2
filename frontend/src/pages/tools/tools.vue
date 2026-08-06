<template>
  <view class="tools-page">
    <GlassNavBar title="工具箱" />

    <scroll-view class="tools-scroll" scroll-y>
      <view class="hero-section">
        <text class="eyebrow">CREATIVE TOOLBOX</text>
        <text class="page-title">创作工具箱</text>
        <text class="page-subtitle">把灵感变成作品，更多自研工具会陆续加入</text>
      </view>

      <view class="section-heading">
        <text class="section-title">全部工具</text>
        <text class="section-count">{{ tools.length }} 项</text>
      </view>

      <view class="tool-grid">
        <view
          v-for="tool in tools"
          :key="tool.id"
          class="tool-card"
          :class="`tool-card--${tool.theme}`"
          hover-class="tool-card--active"
          hover-stay-time="80"
          @tap="openTool(tool)"
        >
          <view class="tool-card-top">
            <view class="tool-icon">
              <text class="tool-icon-text">{{ tool.icon }}</text>
            </view>
            <text class="tool-arrow">↗</text>
          </view>
          <view class="tool-card-content">
            <text class="tool-name">{{ tool.name }}</text>
            <text class="tool-description">{{ tool.description }}</text>
          </view>
          <text class="tool-tag">{{ tool.tag }}</text>
        </view>
      </view>

      <view class="coming-soon">
        <text class="coming-symbol">＋</text>
        <view>
          <text class="coming-title">更多工具，正在制作</text>
          <text class="coming-description">这里仅收录站内自研功能</text>
        </view>
      </view>
    </scroll-view>

    <CustomTabBar :current="2" />
  </view>
</template>

<script setup>
import GlassNavBar from '../../components/GlassNavBar.vue'
import CustomTabBar from '../../components/CustomTabBar.vue'

const tools = [
  {
    id: 'fonts',
    name: '特殊字体',
    description: '输入文字，生成 70 种可复制的 Unicode 特殊字形',
    tag: '文字灵感',
    icon: 'Aa',
    theme: 'type',
    route: '/pages/tools/fonts'
  },
  {
    id: 'text-assets',
    name: '颜文字 / Emoji',
    description: '发现可爱的颜文字与 Emoji 组合，点击即可复制',
    tag: '表达素材',
    icon: '☺',
    theme: 'emoji',
    route: '/pages/tools/text-assets'
  },
  {
    id: 'collage',
    name: '自由拼贴',
    description: '挑选喜欢的素材，自由组合并导出高清拼贴作品',
    tag: '图片创作',
    icon: '✦',
    theme: 'collage',
    route: '/pages/collage/index',
    tab: true
  }
]

function openTool(tool) {
  if (tool.tab) {
    uni.switchTab({ url: tool.route })
    return
  }
  uni.navigateTo({ url: tool.route })
}
</script>

<style lang="scss" scoped>
.tools-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #171512;
  background: #f4efe6;
}

.tools-scroll {
  flex: 1;
  height: 0;
}

.hero-section {
  padding: 48rpx 32rpx 44rpx;
}

.eyebrow {
  display: block;
  color: #8f887c;
  font-size: 19rpx;
  font-weight: 600;
  letter-spacing: 5rpx;
}

.page-title {
  display: block;
  margin-top: 14rpx;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 56rpx;
  font-weight: 500;
  line-height: 1.2;
}

.page-subtitle {
  display: block;
  max-width: 580rpx;
  margin-top: 14rpx;
  color: #706b63;
  font-size: 24rpx;
  line-height: 1.6;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28rpx 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
}

.section-count {
  color: #918a80;
  font-size: 21rpx;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  padding: 0 24rpx;
}

.tool-card {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 390rpx;
  padding: 24rpx;
  overflow: hidden;
  border: 1rpx solid rgba(80, 70, 56, 0.16);
  transition: transform 120ms ease, opacity 120ms ease;
}

.tool-card--type {
  background: #eadfce;
}

.tool-card--collage {
  background: #dce4d5;
}

.tool-card--emoji {
  background: #e6ddea;
}

.tool-card--active {
  opacity: 0.86;
  transform: scale(0.985);
}

.tool-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 82rpx;
  height: 82rpx;
  border: 1rpx solid rgba(23, 21, 18, 0.14);
  border-radius: 50%;
  background: rgba(255, 253, 249, 0.48);
}

.tool-icon-text {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 31rpx;
  font-style: italic;
}

.tool-arrow {
  color: rgba(23, 21, 18, 0.62);
  font-size: 30rpx;
}

.tool-card-content {
  flex: 1;
  padding-top: 50rpx;
}

.tool-name {
  display: block;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 36rpx;
  font-weight: 600;
}

.tool-description {
  display: block;
  margin-top: 16rpx;
  color: #625d55;
  font-size: 21rpx;
  line-height: 1.55;
}

.tool-tag {
  align-self: flex-start;
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(23, 21, 18, 0.12);
  color: #746d63;
  font-size: 18rpx;
  letter-spacing: 2rpx;
}

.coming-soon {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin: 26rpx 24rpx 52rpx;
  padding: 26rpx 28rpx;
  border: 1rpx dashed #c9c1b5;
  background: rgba(255, 253, 249, 0.4);
}

.coming-symbol {
  color: #9c9488;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 48rpx;
  font-weight: 300;
}

.coming-title,
.coming-description {
  display: block;
}

.coming-title {
  font-size: 23rpx;
  font-weight: 600;
}

.coming-description {
  margin-top: 6rpx;
  color: #918a80;
  font-size: 20rpx;
}
</style>
