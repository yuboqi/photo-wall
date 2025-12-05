// ==================== 全局变量 ====================
let stream = null; // 摄像头流
let currentFrame = "solid-color"; // 当前选中的相纸样式（默认白色纯色）
let currentBg = "starry"; // 当前选中的背景（默认星空）
let customFrameUrl = null; // 自定义相纸图片
let customBgUrl = null; // 自定义背景图片
let currentFrameColor = "#FFFFFF"; // 当前相纸纯色
let currentBgColor = "#FFF5F5"; // 当前照片墙纯色
let photoCounter = 0; // 照片计数器
let draggedElement = null; // 当前拖拽的元素
let offsetX = 0; // 拖拽偏移X
let offsetY = 0; // 拖拽偏移Y
let isMirror = true; // 是否镜像（自拍模式）
let currentEditingPolaroid = null; // 当前正在编辑的照片
let isRotating = false; // 是否正在旋转
let rotatingElement = null; // 正在旋转的元素
let startAngle = 0; // 旋转开始角度
let currentRotation = 0; // 当前旋转角度
let maxZIndex = 1; // 最大z-index，用于层级管理

// 照片缩放相关变量
let isResizingPhoto = false;
let resizingPhoto = null;
let resizePhotoHandle = null;
let resizePhotoStartX = 0;
let resizePhotoStartY = 0;
let resizePhotoStartW = 0;
let resizePhotoStartH = 0;
let resizePhotoStartLeft = 0;
let resizePhotoStartTop = 0;

// 图片裁剪相关变量
let cropImageData = null; // 待裁剪的图片数据
let cropCallback = null; // 裁剪完成后的回调
let cropBox = null;
let cropImage = null;
let isDraggingCrop = false;
let cropStartX = 0;
let cropStartY = 0;
let cropBoxStartX = 0;
let cropBoxStartY = 0;
let cropRotation = 0; // 图片旋转角度

// 照片固定尺寸（用于导出）
const POLAROID_WIDTH = 170; // 相纸总宽度
const POLAROID_HEIGHT = 240; // 相纸总高度
const FRAME_PADDING_TOP = 10;
const FRAME_PADDING_SIDE = 10;
const FRAME_PADDING_BOTTOM = 60; // 底部留更多空间给文字
const PHOTO_WIDTH = POLAROID_WIDTH - FRAME_PADDING_SIDE * 2; // 照片宽度 = 150px
const PHOTO_HEIGHT = POLAROID_HEIGHT - FRAME_PADDING_TOP - FRAME_PADDING_BOTTOM; // 照片高度 = 180px

// ==================== DOM元素获取 ====================
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const startCameraBtn = document.getElementById("startCamera");
const captureBtn = document.getElementById("capture");
const stopCameraBtn = document.getElementById("stopCamera");
const shutterBtn = document.getElementById("shutterBtn");
const mirrorToggle = document.getElementById("mirrorToggle");
const fileInput = document.getElementById("fileInput");
const customFrameInput = document.getElementById("customFrameInput");
const customBgInput = document.getElementById("customBgInput");
const photoWall = document.getElementById("photoWall");
const saveWallBtn = document.getElementById("saveWall");
const wallDecoration = document.querySelector(".wall-decoration");
const photoCountDisplay = document.getElementById("photoCount");

// 弹窗元素
const frameModal = document.getElementById("frameModal");
const closeFrameModalBtn = document.getElementById("closeFrameModal");
const modalCustomFrameInput = document.getElementById("modalCustomFrameInput");

// 裁剪弹窗元素
const cropModal = document.getElementById("cropModal");
const closeCropModalBtn = document.getElementById("closeCropModal");
const cancelCropBtn = document.getElementById("cancelCrop");
const confirmCropBtn = document.getElementById("confirmCrop");

// 文字样式弹窗元素
const captionStyleModal = document.getElementById("captionStyleModal");
let currentStylePolaroid = null; // 当前正在编辑样式的照片
let selectedFont = "'Nunito', sans-serif";
let selectedColor = "#666666";
let selectedItalic = "normal";

// 面板折叠元素
const togglePanelBtn = document.getElementById("togglePanel");
const leftPanel = document.getElementById("leftPanel");
let isPanelCollapsed = false;

// ==================== 初始化 ====================
// 初始化滤镜选择功能
function initFilterSelection() {
  const filterOptions = document.querySelectorAll('.filter-option');
  
  filterOptions.forEach(option => {
    option.addEventListener('click', () => {
      // 移除所有选项的active类
      filterOptions.forEach(opt => opt.classList.remove('active'));
      
      // 为点击的选项添加active类
      option.classList.add('active');
      
      console.log('选择了滤镜:', option.dataset.filter);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🎀 可爱拍立得照片墙已加载！");
  initEventListeners();
  initDecorations();
  initCropModal();
  initFilterSelection(); // 初始化滤镜选择功能
  
  // 检查是否已有照片，决定是否显示空状态提示
  const photos = photoWall.querySelectorAll(".polaroid");
  const emptyState = photoWall.querySelector(".empty-state");
  if (photos.length === 0 && emptyState) {
    emptyState.style.display = "block";
  }
});

// ==================== 事件监听器初始化 ====================
function initEventListeners() {
  // 摄像头控制
  startCameraBtn.addEventListener("click", startCamera);
  captureBtn.addEventListener("click", capturePhoto);
  stopCameraBtn.addEventListener("click", stopCamera);

  // 快门按钮点击
  shutterBtn.addEventListener("click", () => {
    if (stream) {
      capturePhoto();
    } else {
      startCamera();
    }
  });

  // 镜像切换
  mirrorToggle.addEventListener("change", (e) => {
    isMirror = e.target.checked;
    if (video.style.display !== "none") {
      video.classList.toggle("mirrored", isMirror);
    }
    console.log("🪞 镜像模式:", isMirror ? "开启" : "关闭");
  });

  // 文件上传
  fileInput.addEventListener("change", handleFileUpload);
  customFrameInput.addEventListener("change", handleCustomFrame);
  customBgInput.addEventListener("change", handleCustomBg);
  modalCustomFrameInput.addEventListener("change", handleModalCustomFrame);

  // 相纸样式选择
  document.querySelectorAll(".frame-option").forEach((option) => {
    option.addEventListener("click", () => selectFrame(option));
  });

  // 背景选择
  document.querySelectorAll(".bg-option").forEach((option) => {
    option.addEventListener("click", () => selectBackground(option));
  });

  // 排版模板选择
  document.querySelectorAll(".layout-option").forEach((option) => {
    option.addEventListener("click", () => applyLayout(option));
  });

  // 保存照片墙
  saveWallBtn.addEventListener("click", savePhotoWall);

  // 弹窗事件
  closeFrameModalBtn.addEventListener("click", closeFrameModal);
  frameModal.addEventListener("click", (e) => {
    if (e.target === frameModal) closeFrameModal();
  });

  // 弹窗内相纸选择
  document.querySelectorAll(".modal-frame-option").forEach((option) => {
    option.addEventListener("click", () => selectModalFrame(option));
  });

  // 裁剪弹窗事件
  closeCropModalBtn.addEventListener("click", closeCropModal);
  cancelCropBtn.addEventListener("click", closeCropModal);
  confirmCropBtn.addEventListener("click", confirmCrop);
  cropModal.addEventListener("click", (e) => {
    if (e.target === cropModal) closeCropModal();
  });

  // 文字样式弹窗事件
  initCaptionStyleModal();

  // 面板折叠事件
  togglePanelBtn.addEventListener("click", togglePanel);

  // 颜色选择器事件
  initColorPickers();
  initModalColorPicker();

  console.log("✨ 所有事件监听器已初始化");
}

// ==================== 颜色选择器初始化 ====================
/**
 * 初始化颜色选择器功能
 */
function initColorPickers() {
  // 相纸颜色选择器
  const frameColorPicker = document.getElementById("frameColorPicker");
  const frameColorValue = document.getElementById("frameColorValue");
  const frameColorPresets = document.querySelectorAll(
    ".frame-color-picker .color-preset"
  );

  // 照片墙颜色选择器
  const bgColorPicker = document.getElementById("bgColorPicker");
  const bgColorValue = document.getElementById("bgColorValue");
  const bgColorPresets = document.querySelectorAll(
    ".bg-color-picker .color-preset"
  );

  // 相纸颜色选择器事件
  if (frameColorPicker) {
    frameColorPicker.addEventListener("input", (e) => {
      currentFrameColor = e.target.value;
      frameColorValue.textContent = currentFrameColor.toUpperCase();
      updateFrameColorPresetSelection(currentFrameColor);
      console.log("🎨 相纸颜色已更改为:", currentFrameColor);
    });
  }

  // 相纸预设颜色点击事件
  frameColorPresets.forEach((preset) => {
    preset.addEventListener("click", () => {
      const color = preset.dataset.color;
      currentFrameColor = color;
      if (frameColorPicker) frameColorPicker.value = color;
      if (frameColorValue) frameColorValue.textContent = color;
      updateFrameColorPresetSelection(color);
      console.log("🎨 选择相纸预设颜色:", color);
    });
  });

  // 照片墙颜色选择器事件
  if (bgColorPicker) {
    bgColorPicker.addEventListener("input", (e) => {
      currentBgColor = e.target.value;
      bgColorValue.textContent = currentBgColor.toUpperCase();
      updateBgColorPresetSelection(currentBgColor);
      applyBackgroundColor(currentBgColor);
      console.log("🖼️ 照片墙颜色已更改为:", currentBgColor);
    });
  }

  // 照片墙预设颜色点击事件
  bgColorPresets.forEach((preset) => {
    preset.addEventListener("click", () => {
      const color = preset.dataset.color;
      currentBgColor = color;
      if (bgColorPicker) bgColorPicker.value = color;
      if (bgColorValue) bgColorValue.textContent = color;
      updateBgColorPresetSelection(color);
      applyBackgroundColor(color);
      console.log("🖼️ 选择照片墙预设颜色:", color);
    });
  });
}

/**
 * 更新相纸颜色预设选中状态
 */
function updateFrameColorPresetSelection(color) {
  document
    .querySelectorAll(".frame-color-picker .color-preset")
    .forEach((preset) => {
      if (preset.dataset.color.toLowerCase() === color.toLowerCase()) {
        preset.classList.add("active");
      } else {
        preset.classList.remove("active");
      }
    });
}

/**
 * 初始化弹窗内颜色选择器
 */
function initModalColorPicker() {
  const modalColorPicker = document.getElementById("modalFrameColorPicker");
  const modalColorValue = document.getElementById("modalFrameColorValue");
  const applyModalColorBtn = document.getElementById("applyModalColor");
  const modalColorPresets = document.querySelectorAll(".modal-color-preset");

  let selectedModalColor = "#FFFFFF";

  // 弹窗颜色选择器事件
  if (modalColorPicker) {
    modalColorPicker.addEventListener("input", (e) => {
      selectedModalColor = e.target.value;
      if (modalColorValue)
        modalColorValue.textContent = selectedModalColor.toUpperCase();
      updateModalColorPresetSelection(selectedModalColor);
    });
  }

  // 弹窗预设颜色点击事件
  modalColorPresets.forEach((preset) => {
    preset.addEventListener("click", () => {
      const color = preset.dataset.color;
      selectedModalColor = color;
      if (modalColorPicker) modalColorPicker.value = color;
      if (modalColorValue) modalColorValue.textContent = color;
      updateModalColorPresetSelection(color);
    });
  });

  // 应用颜色按钮
  if (applyModalColorBtn) {
    applyModalColorBtn.addEventListener("click", () => {
      applyModalFrameColor(selectedModalColor);
    });
  }
}

/**
 * 更新弹窗内颜色预设选中状态
 */
function updateModalColorPresetSelection(color) {
  document.querySelectorAll(".modal-color-preset").forEach((preset) => {
    if (preset.dataset.color.toLowerCase() === color.toLowerCase()) {
      preset.classList.add("active");
    } else {
      preset.classList.remove("active");
    }
  });
}

/**
 * 应用弹窗内选择的颜色到当前编辑的照片
 */
function applyModalFrameColor(color) {
  if (currentEditingPolaroid) {
    const inner = currentEditingPolaroid.querySelector(".polaroid-inner");

    // 移除所有相纸样式类和自定义背景
    inner.classList.remove(
      "frame-bear",
      "frame-rainbow",
      "frame-flower",
      "frame-custom",
      "frame-ocean",
      "frame-candy",
      "frame-lavender",
      "frame-lemon",
      "frame-mint",
      "frame-solid-color"
    );
    inner.style.backgroundImage = "";
    inner.removeAttribute("data-custom");

    // 添加纯色样式
    inner.classList.add("frame-solid-color");
    inner.style.backgroundColor = color;
    inner.setAttribute("data-solid-color", color);

    console.log("✅ 照片相纸已更换为纯色:", color);
  }

  closeFrameModal();
}

/**
 * 更新照片墙颜色预设选中状态
 */
function updateBgColorPresetSelection(color) {
  document
    .querySelectorAll(".bg-color-picker .color-preset")
    .forEach((preset) => {
      if (preset.dataset.color.toLowerCase() === color.toLowerCase()) {
        preset.classList.add("active");
      } else {
        preset.classList.remove("active");
      }
    });
}

/**
 * 应用纯色背景到照片墙
 */
function applyBackgroundColor(color) {
  // 移除所有背景类
  photoWall.classList.remove(
    "bg-starry-wall",
    "bg-cloud-wall",
    "bg-meadow-wall",
    "bg-sunset-wall",
    "bg-aurora-wall",
    "bg-beach-wall",
    "bg-forest-wall",
    "bg-cherry-wall"
  );

  // 清除自定义背景图片
  photoWall.style.backgroundImage = "";
  photoWall.style.backgroundSize = "";
  photoWall.style.backgroundPosition = "";

  // 应用纯色背景
  photoWall.style.backgroundColor = color;

  // 清除装饰元素
  if (wallDecoration) {
    wallDecoration.innerHTML = "";
  }

  console.log("✅ 照片墙纯色背景已应用:", color);
}

// ==================== 面板折叠功能 ====================
/**
 * 切换左侧面板的显示/隐藏
 */
function togglePanel() {
  // 检测是否是移动端（竖向布局）
  const isMobile = window.innerWidth <= 480;

  // 切换前，将所有照片的位置转换为百分比
  const photos = photoWall.querySelectorAll(".polaroid");
  const wallWidth = photoWall.offsetWidth;
  const wallHeight = photoWall.offsetHeight;

  photos.forEach((photo) => {
    // 获取当前位置（可能是像素或百分比）
    let currentLeft = photo.style.left;
    let currentTop = photo.style.top;

    // 如果是像素值，转换为百分比
    if (currentLeft.includes("px")) {
      const leftPx = parseFloat(currentLeft);
      const leftPercent = (leftPx / wallWidth) * 100;
      photo.style.left = leftPercent + "%";
    }

    if (currentTop.includes("px")) {
      const topPx = parseFloat(currentTop);
      const topPercent = (topPx / wallHeight) * 100;
      photo.style.top = topPercent + "%";
    }
  });

  isPanelCollapsed = !isPanelCollapsed;

  if (isPanelCollapsed) {
    leftPanel.classList.add("collapsed");
    togglePanelBtn.classList.add("collapsed");
    console.log("📁 控制面板已折叠");
  } else {
    leftPanel.classList.remove("collapsed");
    togglePanelBtn.classList.remove("collapsed");
    console.log("📂 控制面板已展开");
  }
  // 使用百分比定位后，照片会自动保持相对位置
}

// ==================== 初始化装饰元素 ====================
function initDecorations() {
  updateWallDecorations("starry");
}

// ==================== 初始化裁剪弹窗 ====================
function initCropModal() {
  cropBox = document.getElementById("cropBox");
  cropImage = document.getElementById("cropImage");

  if (!cropBox || !cropImage) return;

  // 裁剪框拖动
  cropBox.addEventListener("mousedown", startCropDrag);
  cropBox.addEventListener("touchstart", startCropDrag, { passive: false });

  // 旋转滑块
  const rotateSlider = document.getElementById("cropRotateSlider");
  const rotateValue = document.getElementById("cropRotateValue");
  if (rotateSlider) {
    rotateSlider.addEventListener("input", (e) => {
      cropRotation = parseInt(e.target.value);
      if (rotateValue) {
        rotateValue.textContent = cropRotation + "°";
      }
      if (cropImage) {
        cropImage.style.transform = `rotate(${cropRotation}deg)`;
      }
    });
  }
}

// ==================== 更新墙面装饰 ====================
function updateWallDecorations(bgType) {
  if (!wallDecoration) return;

  let decorHTML = "";

  switch (bgType) {
    case "starry":
      decorHTML = `
                <div class="deco-star deco-1">⭐</div>
                <div class="deco-star deco-2">✨</div>
                <div class="deco-star deco-3">🌟</div>
                <div class="deco-star deco-4">💫</div>
                <div class="deco-moon">🌙</div>
            `;
      break;
    case "cloud":
      decorHTML = `
                <div class="deco-star deco-1" style="font-size: 30px;">☁️</div>
                <div class="deco-star deco-2" style="font-size: 25px;">☁️</div>
                <div class="deco-star deco-3" style="font-size: 35px;">☁️</div>
                <div class="deco-star deco-4" style="font-size: 20px;">🦋</div>
                <div class="deco-moon" style="font-size: 28px;">🌤️</div>
            `;
      break;
    case "meadow":
      decorHTML = `
                <div class="deco-star deco-1" style="font-size: 24px;">🌼</div>
                <div class="deco-star deco-2" style="font-size: 20px;">🌸</div>
                <div class="deco-star deco-3" style="font-size: 22px;">🌷</div>
                <div class="deco-star deco-4" style="font-size: 18px;">🦋</div>
                <div class="deco-moon" style="font-size: 26px; top: 5%; right: 5%;">🌻</div>
            `;
      break;
    case "sunset":
      decorHTML = `
                <div class="deco-star deco-1" style="font-size: 24px;">🌅</div>
                <div class="deco-star deco-2" style="font-size: 20px;">🌇</div>
                <div class="deco-star deco-3" style="font-size: 18px;">🐦</div>
                <div class="deco-star deco-4" style="font-size: 16px;">🐦</div>
                <div class="deco-moon" style="font-size: 35px; top: 15%; right: 10%;">☀️</div>
            `;
      break;
    case "aurora":
      decorHTML = `
                <div class="deco-star deco-1">⭐</div>
                <div class="deco-star deco-2">✨</div>
                <div class="deco-star deco-3">💫</div>
                <div class="deco-star deco-4">🌟</div>
                <div class="deco-moon" style="font-size: 30px;">🌌</div>
            `;
      break;
    case "beach":
      decorHTML = `
                <div class="deco-star deco-1" style="font-size: 24px;">🐚</div>
                <div class="deco-star deco-2" style="font-size: 20px;">🦀</div>
                <div class="deco-star deco-3" style="font-size: 22px;">⛱️</div>
                <div class="deco-star deco-4" style="font-size: 18px;">🐠</div>
                <div class="deco-moon" style="font-size: 28px; top: 5%; right: 10%;">☀️</div>
            `;
      break;
    case "forest":
      decorHTML = `
                <div class="deco-star deco-1" style="font-size: 28px;">🌲</div>
                <div class="deco-star deco-2" style="font-size: 24px;">🌳</div>
                <div class="deco-star deco-3" style="font-size: 20px;">🍄</div>
                <div class="deco-star deco-4" style="font-size: 18px;">🦊</div>
                <div class="deco-moon" style="font-size: 22px; top: 8%; right: 8%;">🦉</div>
            `;
      break;
    case "cherry":
      decorHTML = `
                <div class="deco-star deco-1" style="font-size: 22px;">🌸</div>
                <div class="deco-star deco-2" style="font-size: 18px;">🌸</div>
                <div class="deco-star deco-3" style="font-size: 20px;">🌸</div>
                <div class="deco-star deco-4" style="font-size: 16px;">🎀</div>
                <div class="deco-moon" style="font-size: 24px; top: 5%; right: 8%;">💮</div>
            `;
      break;
    default:
      decorHTML = "";
  }

  wallDecoration.innerHTML = decorHTML;
}

// ==================== 摄像头功能 ====================
/**
 * 启动摄像头
 */
async function startCamera() {
  console.log("📷 尝试启动摄像头...");
  try {
    // 请求摄像头权限
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 1280 },
        facingMode: "user",
      },
    });

    video.srcObject = stream;
    video.style.display = "block";
    preview.style.display = "none";
    cameraPlaceholder.style.display = "none";

    // 应用镜像
    if (isMirror) {
      video.classList.add("mirrored");
    }

    // 更新按钮状态
    startCameraBtn.style.display = "none";
    captureBtn.style.display = "inline-flex";
    stopCameraBtn.style.display = "inline-flex";

    console.log("✅ 摄像头启动成功！");
  } catch (error) {
    console.error("❌ 摄像头启动失败:", error);
    alert("无法访问摄像头，请确保已授予权限哦~ 🥺\n错误信息: " + error.message);
  }
}

/**
 * 拍照
 */
function capturePhoto() {
  console.log("📸 咔嚓！拍照中...");

  // 添加闪光效果
  createFlashEffect();

  // 设置canvas为正方形（取视频的中心区域）
  const size = Math.min(video.videoWidth, video.videoHeight);
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  // 计算裁剪区域（居中裁剪为正方形）
  const sx = (video.videoWidth - size) / 2;
  const sy = (video.videoHeight - size) / 2;

  // 如果需要镜像
  if (isMirror) {
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
  }

  // 绘制正方形区域
  ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

  // 获取图片数据
  const imageData = canvas.toDataURL("image/png");

  // 不切换到预览模式，保持摄像头继续显示，这样可以连续拍照
  // previewImg.src = imageData;
  // video.style.display = 'none';
  // preview.style.display = 'flex';

  // 添加到照片墙
  addPhotoToWall(imageData);

  // 更新计数器
  updatePhotoCount();

  console.log("✨ 拍照完成！照片已添加到照片墙，可以继续拍照");
}

/**
 * 更新照片计数
 */
function updatePhotoCount() {
  const count = Math.max(0, 10 - (photoCounter % 10));
  if (photoCountDisplay) {
    photoCountDisplay.textContent = count;
  }
}

/**
 * 创建闪光效果
 */
function createFlashEffect() {
  const flash = document.createElement("div");
  flash.className = "flash-effect";
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.remove();
  }, 300);
}

/**
 * 关闭摄像头
 */
function stopCamera() {
  console.log("⏹️ 关闭摄像头...");

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  video.srcObject = null;
  video.style.display = "none";
  video.classList.remove("mirrored");
  preview.style.display = "none";
  cameraPlaceholder.style.display = "flex";

  // 更新按钮状态
  startCameraBtn.style.display = "inline-flex";
  captureBtn.style.display = "none";
  stopCameraBtn.style.display = "none";

  console.log("✅ 摄像头已关闭");
}

// ==================== 文件上传功能 ====================
/**
 * 处理文件上传（支持多张照片）
 */
function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  console.log(`📁 上传 ${files.length} 张照片`);

  // 过滤出图片文件
  const imageFiles = Array.from(files).filter((file) =>
    file.type.startsWith("image/")
  );

  if (imageFiles.length === 0) {
    alert("请选择图片文件哦~ 🖼️");
    return;
  }

  if (imageFiles.length < files.length) {
    alert(`已过滤掉 ${files.length - imageFiles.length} 个非图片文件 📁`);
  }

  // 依次处理每张图片，添加延迟让动画效果更好
  let delay = 0;
  imageFiles.forEach((file, index) => {
    setTimeout(() => {
      processAndAddPhoto(file, index + 1, imageFiles.length);
    }, delay);
    delay += 200; // 每张照片间隔200ms
  });

  // 重置input以允许重复上传同一文件
  event.target.value = "";
}

/**
 * 处理单张照片并添加到照片墙
 */
function processAndAddPhoto(file, current, total) {
  console.log(`📷 处理照片 ${current}/${total}: ${file.name}`);

  const reader = new FileReader();
  reader.onload = (e) => {
    processImageToSquare(e.target.result, (squareImageData) => {
      addPhotoToWall(squareImageData);
      updatePhotoCount();
      console.log(`✨ 照片 ${current}/${total} 已添加到照片墙`);
    });
  };
  reader.onerror = (error) => {
    console.error(`❌ 照片 ${current}/${total} 读取失败:`, error);
  };
  reader.readAsDataURL(file);
}

/**
 * 将图片处理为正方形
 */
function processImageToSquare(imageData, callback) {
  const img = new Image();
  img.onload = () => {
    const size = Math.min(img.width, img.height);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext("2d");

    // 居中裁剪
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;
    ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

    // 获取当前选中的滤镜
    const activeFilterOption = document.querySelector('.filter-option.active');
    const filterType = activeFilterOption ? activeFilterOption.dataset.filter : 'original';

    // 如果是原图滤镜，则直接回调
    if (filterType === 'original') {
      callback(tempCanvas.toDataURL("image/png"));
      return;
    }

    // 应用滤镜效果
    FilterProcessor.applyFilter(img, filterType).then(filteredCanvas => {
      callback(filteredCanvas.toDataURL("image/jpeg", 0.92));
    }).catch(error => {
      console.error('滤镜应用失败:', error);
      // 如果滤镜应用失败，仍然使用原图
      callback(tempCanvas.toDataURL("image/png"));
    });
  };
  img.src = imageData;
}

/**
 * 处理自定义相纸 - 打开裁剪弹窗
 */
function handleCustomFrame(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log("🎨 上传自定义相纸:", file.name);

  const reader = new FileReader();
  reader.onload = (e) => {
    // 打开裁剪弹窗
    openCropModal(e.target.result, (croppedData) => {
      customFrameUrl = croppedData;
      currentFrame = "custom";

      // 更新选中状态
      document
        .querySelectorAll(".frame-option")
        .forEach((opt) => opt.classList.remove("active"));
      document
        .querySelector('.frame-option[data-frame="custom"]')
        .classList.add("active");

      // 更新自定义预览
      const customPreview = document.querySelector(
        '.frame-option[data-frame="custom"] .frame-preview'
      );
      customPreview.style.backgroundImage = `url(${customFrameUrl})`;
      customPreview.style.backgroundSize = "cover";
      customPreview.style.backgroundPosition = "center";
      customPreview.innerHTML = "";

      console.log("✅ 自定义相纸设置成功！");
    });
  };
  reader.readAsDataURL(file);

  event.target.value = "";
}

/**
 * 处理弹窗中的自定义相纸上传 - 打开裁剪弹窗
 */
function handleModalCustomFrame(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log("🎨 上传自定义相纸(弹窗):", file.name);

  const reader = new FileReader();
  reader.onload = (e) => {
    // 打开裁剪弹窗
    openCropModal(e.target.result, (croppedData) => {
      if (currentEditingPolaroid) {
        const inner = currentEditingPolaroid.querySelector(".polaroid-inner");

        // 移除所有相纸样式类
        inner.classList.remove(
          "frame-bear",
          "frame-rainbow",
          "frame-flower",
          "frame-custom"
        );
        inner.classList.add("frame-custom");

        // 应用自定义背景
        inner.style.backgroundImage = `url(${croppedData})`;
        inner.style.backgroundSize = "cover";
        inner.style.backgroundPosition = "center";

        // 清除伪元素内容
        inner.setAttribute("data-custom", "true");

        console.log("✅ 照片相纸已更换为自定义！");
      }
      closeFrameModal();
    });
  };
  reader.readAsDataURL(file);

  event.target.value = "";
}

/**
 * 处理自定义背景
 */
function handleCustomBg(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log("🖼️ 上传自定义背景:", file.name);

  const reader = new FileReader();
  reader.onload = (e) => {
    customBgUrl = e.target.result;
    currentBg = "custom";

    // 应用自定义背景
    photoWall.style.backgroundImage = `url(${customBgUrl})`;
    photoWall.style.backgroundSize = "cover";
    photoWall.style.backgroundPosition = "center";
    photoWall.className = "photo-wall";

    // 隐藏装饰
    if (wallDecoration) {
      wallDecoration.innerHTML = "";
    }

    // 更新选中状态
    document
      .querySelectorAll(".bg-option")
      .forEach((opt) => opt.classList.remove("active"));
    document
      .querySelector('.bg-option[data-bg="custom"]')
      .classList.add("active");

    // 更新自定义预览
    const customPreview = document.querySelector(
      '.bg-option[data-bg="custom"] .bg-preview'
    );
    customPreview.style.backgroundImage = `url(${customBgUrl})`;
    customPreview.style.backgroundSize = "cover";
    customPreview.style.backgroundPosition = "center";
    customPreview.innerHTML = "";

    console.log("✅ 自定义背景设置成功！");
  };
  reader.readAsDataURL(file);

  event.target.value = "";
}

// ==================== 图片裁剪功能 ====================
/**
 * 打开裁剪弹窗
 */
function openCropModal(imageData, callback) {
  cropImageData = imageData;
  cropCallback = callback;
  cropRotation = 0; // 重置旋转角度

  // 重置旋转滑块
  const rotateSlider = document.getElementById("cropRotateSlider");
  const rotateValue = document.getElementById("cropRotateValue");
  if (rotateSlider) rotateSlider.value = 0;
  if (rotateValue) rotateValue.textContent = "0°";

  cropImage.src = imageData;
  cropImage.style.transform = "rotate(0deg)";

  cropImage.onload = () => {
    const wrapper = document.getElementById("cropImageWrapper");
    const wrapperWidth = wrapper.offsetWidth;
    const wrapperHeight = wrapper.offsetHeight;

    // 裁剪框固定尺寸为相纸尺寸 170x240
    const boxWidth = 170;
    const boxHeight = 240;

    // 将裁剪框居中放置
    const left = (wrapperWidth - boxWidth) / 2;
    const top = (wrapperHeight - boxHeight) / 2;

    cropBox.style.left = left + "px";
    cropBox.style.top = top + "px";
    cropBox.style.width = boxWidth + "px";
    cropBox.style.height = boxHeight + "px";

    cropModal.style.display = "flex";
  };
}

/**
 * 关闭裁剪弹窗
 */
function closeCropModal() {
  cropModal.style.display = "none";
  cropImageData = null;
  cropCallback = null;
}

/**
 * 确认裁剪
 */
function confirmCrop() {
  if (!cropImageData || !cropCallback) return;

  const img = new Image();
  img.onload = () => {
    const wrapper = document.getElementById("cropImageWrapper");
    const wrapperRect = wrapper.getBoundingClientRect();
    const imgRect = cropImage.getBoundingClientRect();

    // 获取裁剪框位置（相对于wrapper）
    const boxLeft = parseFloat(cropBox.style.left);
    const boxTop = parseFloat(cropBox.style.top);
    const boxWidth = parseFloat(cropBox.style.width);
    const boxHeight = parseFloat(cropBox.style.height);

    // 创建临时canvas来处理旋转后的图片
    const rotatedCanvas = document.createElement("canvas");
    const rotatedCtx = rotatedCanvas.getContext("2d");

    // 如果有旋转，先创建旋转后的图片
    if (cropRotation !== 0) {
      const radians = (cropRotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));

      // 计算旋转后的图片尺寸
      const rotatedWidth = img.width * cos + img.height * sin;
      const rotatedHeight = img.width * sin + img.height * cos;

      rotatedCanvas.width = rotatedWidth;
      rotatedCanvas.height = rotatedHeight;

      rotatedCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
      rotatedCtx.rotate(radians);
      rotatedCtx.drawImage(img, -img.width / 2, -img.height / 2);
    } else {
      rotatedCanvas.width = img.width;
      rotatedCanvas.height = img.height;
      rotatedCtx.drawImage(img, 0, 0);
    }

    // 计算显示的图片在wrapper中的位置和缩放比例
    const displayedImgWidth = cropImage.offsetWidth;
    const displayedImgHeight = cropImage.offsetHeight;

    // 图片在wrapper中居中显示
    const imgOffsetX = (wrapper.offsetWidth - displayedImgWidth) / 2;
    const imgOffsetY = (wrapper.offsetHeight - displayedImgHeight) / 2;

    // 计算裁剪框相对于显示图片的位置
    const cropRelativeX = boxLeft - imgOffsetX;
    const cropRelativeY = boxTop - imgOffsetY;

    // 计算缩放比例
    const scaleX = rotatedCanvas.width / displayedImgWidth;
    const scaleY = rotatedCanvas.height / displayedImgHeight;

    // 计算实际裁剪区域
    const sx = Math.max(0, cropRelativeX * scaleX);
    const sy = Math.max(0, cropRelativeY * scaleY);
    const sw = boxWidth * scaleX;
    const sh = boxHeight * scaleY;

    // 创建最终输出canvas
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = boxWidth * 2; // 2倍分辨率
    outputCanvas.height = boxHeight * 2;
    const outputCtx = outputCanvas.getContext("2d");

    outputCtx.drawImage(
      rotatedCanvas,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      outputCanvas.width,
      outputCanvas.height
    );

    const croppedData = outputCanvas.toDataURL("image/png");
    cropCallback(croppedData);
    closeCropModal();
  };
  img.src = cropImageData;
}

/**
 * 开始拖动裁剪框
 */
function startCropDrag(e) {
  if (e.target.classList.contains("crop-handle")) return;

  e.preventDefault();
  isDraggingCrop = true;

  if (e.type === "mousedown") {
    cropStartX = e.clientX;
    cropStartY = e.clientY;
  } else {
    cropStartX = e.touches[0].clientX;
    cropStartY = e.touches[0].clientY;
  }

  cropBoxStartX = parseFloat(cropBox.style.left);
  cropBoxStartY = parseFloat(cropBox.style.top);

  document.addEventListener("mousemove", doCropDrag);
  document.addEventListener("mouseup", stopCropDrag);
  document.addEventListener("touchmove", doCropDrag, { passive: false });
  document.addEventListener("touchend", stopCropDrag);
}

/**
 * 拖动裁剪框中
 */
function doCropDrag(e) {
  if (!isDraggingCrop) return;
  e.preventDefault();

  let clientX, clientY;
  if (e.type === "mousemove") {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  const dx = clientX - cropStartX;
  const dy = clientY - cropStartY;

  let newLeft = cropBoxStartX + dx;
  let newTop = cropBoxStartY + dy;

  // 获取wrapper尺寸限制移动范围
  const wrapper = document.getElementById("cropImageWrapper");
  const wrapperWidth = wrapper.offsetWidth;
  const wrapperHeight = wrapper.offsetHeight;
  const boxWidth = parseFloat(cropBox.style.width);
  const boxHeight = parseFloat(cropBox.style.height);

  // 限制在wrapper范围内
  newLeft = Math.max(0, Math.min(newLeft, wrapperWidth - boxWidth));
  newTop = Math.max(0, Math.min(newTop, wrapperHeight - boxHeight));

  cropBox.style.left = newLeft + "px";
  cropBox.style.top = newTop + "px";
}

/**
 * 停止拖动裁剪框
 */
function stopCropDrag() {
  isDraggingCrop = false;
  document.removeEventListener("mousemove", doCropDrag);
  document.removeEventListener("mouseup", stopCropDrag);
  document.removeEventListener("touchmove", doCropDrag);
  document.removeEventListener("touchend", stopCropDrag);
}

// ==================== 样式选择功能 ====================
/**
 * 选择相纸样式
 */
function selectFrame(option) {
  const frame = option.dataset.frame;
  console.log("🎨 选择相纸样式:", frame);

  // 如果选择自定义，触发文件选择
  if (frame === "custom") {
    customFrameInput.click();
    return;
  }

  // 如果选择纯色，显示颜色选择器
  if (frame === "solid-color") {
    const frameColorPicker = document.querySelector(".frame-color-picker");
    if (frameColorPicker) {
      frameColorPicker.style.display = "block";
    }
  } else {
    // 隐藏颜色选择器
    const frameColorPicker = document.querySelector(".frame-color-picker");
    if (frameColorPicker) {
      frameColorPicker.style.display = "none";
    }
  }

  currentFrame = frame;

  // 更新选中状态
  document
    .querySelectorAll(".frame-option")
    .forEach((opt) => opt.classList.remove("active"));
  option.classList.add("active");
}

/**
 * 选择背景
 */
function selectBackground(option) {
  const bg = option.dataset.bg;
  console.log("🖼️ 选择背景:", bg);

  // 如果选择自定义，触发文件选择
  if (bg === "custom") {
    customBgInput.click();
    return;
  }

  // 如果选择纯色，显示颜色选择器
  if (bg === "solid-color") {
    const bgColorPicker = document.querySelector(".bg-color-picker");
    if (bgColorPicker) {
      bgColorPicker.style.display = "block";
    }
    // 应用当前选中的纯色
    applyBackgroundColor(currentBgColor);
  } else {
    // 隐藏颜色选择器
    const bgColorPicker = document.querySelector(".bg-color-picker");
    if (bgColorPicker) {
      bgColorPicker.style.display = "none";
    }
    // 应用预设背景
    applyBackground(bg);
  }

  currentBg = bg;

  // 更新选中状态
  document
    .querySelectorAll(".bg-option")
    .forEach((opt) => opt.classList.remove("active"));
  option.classList.add("active");
}

/**
 * 应用背景样式
 */
function applyBackground(bg) {
  // 清除自定义背景
  photoWall.style.backgroundImage = "";
  photoWall.style.backgroundSize = "";
  photoWall.style.backgroundPosition = "";

  // 移除所有背景类
  photoWall.classList.remove(
    "bg-starry-wall",
    "bg-cloud-wall",
    "bg-meadow-wall",
    "bg-sunset-wall",
    "bg-aurora-wall",
    "bg-beach-wall",
    "bg-forest-wall",
    "bg-cherry-wall"
  );

  switch (bg) {
    case "starry":
      photoWall.classList.add("bg-starry-wall");
      break;
    case "cloud":
      photoWall.classList.add("bg-cloud-wall");
      break;
    case "meadow":
      photoWall.classList.add("bg-meadow-wall");
      break;
    case "sunset":
      photoWall.classList.add("bg-sunset-wall");
      break;
    case "aurora":
      photoWall.classList.add("bg-aurora-wall");
      break;
    case "beach":
      photoWall.classList.add("bg-beach-wall");
      break;
    case "forest":
      photoWall.classList.add("bg-forest-wall");
      break;
    case "cherry":
      photoWall.classList.add("bg-cherry-wall");
      break;
  }

  // 更新装饰
  updateWallDecorations(bg);

  console.log("✅ 背景已更新为:", bg);
}

// ==================== 排版模板功能 ====================
/**
 * 应用排版模板
 */
function applyLayout(option) {
  const layout = option.dataset.layout;
  console.log("📐 应用排版模板:", layout);

  // 获取所有照片
  const photos = photoWall.querySelectorAll(".polaroid");
  if (photos.length === 0) {
    alert("照片墙还没有照片哦，先拍几张照片吧~ 📷✨");
    return;
  }

  // 更新选中状态
  document
    .querySelectorAll(".layout-option")
    .forEach((opt) => opt.classList.remove("active"));
  option.classList.add("active");

  // 获取照片墙尺寸
  const wallWidth = photoWall.offsetWidth;
  const wallHeight = photoWall.offsetHeight;

  // 计算照片尺寸（相纸尺寸）
  const photoWidth = POLAROID_WIDTH;
  const photoHeight = POLAROID_HEIGHT;

  // 根据不同模板计算位置
  const positions = calculateLayoutPositions(
    layout,
    photos.length,
    wallWidth,
    wallHeight,
    photoWidth,
    photoHeight
  );

  // 应用位置和旋转动画
  photos.forEach((photo, index) => {
    if (positions[index]) {
      const { x, y, rotation } = positions[index];

      // 添加过渡动画
      photo.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
      photo.style.left = x + "px";
      photo.style.top = y + "px";
      photo.style.transform = `rotate(${rotation}deg)`;
      photo.dataset.rotation = rotation;

      // 动画结束后移除过渡
      setTimeout(() => {
        photo.style.transition = "box-shadow 0.2s ease";
      }, 500);
    }
  });

  console.log(`✨ 已将 ${photos.length} 张照片按 "${layout}" 模板排列`);
}

/**
 * 计算排版位置
 */
function calculateLayoutPositions(
  layout,
  count,
  wallWidth,
  wallHeight,
  photoWidth,
  photoHeight
) {
  const positions = [];
  const padding = 30; // 边距
  const availableWidth = wallWidth - photoWidth - padding * 2;
  const availableHeight = wallHeight - photoHeight - padding * 2;

  switch (layout) {
    case "grid":
      // 网格排列
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const cellWidth = availableWidth / Math.max(cols - 1, 1);
      const cellHeight = availableHeight / Math.max(rows - 1, 1);

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        positions.push({
          x: padding + col * cellWidth,
          y: padding + row * cellHeight,
          rotation: (Math.random() - 0.5) * 6, // 轻微随机旋转
        });
      }
      break;

    case "row":
      // 横向排列
      const rowSpacing = availableWidth / Math.max(count - 1, 1);
      const rowY = (wallHeight - photoHeight) / 2;

      for (let i = 0; i < count; i++) {
        positions.push({
          x: padding + i * rowSpacing,
          y: rowY,
          rotation: (Math.random() - 0.5) * 8,
        });
      }
      break;

    case "column":
      // 纵向排列
      const colSpacing = availableHeight / Math.max(count - 1, 1);
      const colX = (wallWidth - photoWidth) / 2;

      for (let i = 0; i < count; i++) {
        positions.push({
          x: colX,
          y: padding + i * colSpacing,
          rotation: (Math.random() - 0.5) * 8,
        });
      }
      break;

    case "diagonal":
      // 对角线排列
      const diagSpacingX = availableWidth / Math.max(count - 1, 1);
      const diagSpacingY = availableHeight / Math.max(count - 1, 1);

      for (let i = 0; i < count; i++) {
        positions.push({
          x: padding + i * diagSpacingX,
          y: padding + i * diagSpacingY,
          rotation: -15 + (Math.random() - 0.5) * 10,
        });
      }
      break;

    case "circle":
      // 环形排列
      const centerX = wallWidth / 2 - photoWidth / 2;
      const centerY = wallHeight / 2 - photoHeight / 2;
      const radiusX = (Math.min(availableWidth, availableHeight) / 2) * 0.7;
      const radiusY = radiusX * 0.8;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2; // 从顶部开始
        positions.push({
          x: centerX + Math.cos(angle) * radiusX,
          y: centerY + Math.sin(angle) * radiusY,
          rotation: (angle * 180) / Math.PI + 90 + (Math.random() - 0.5) * 10,
        });
      }
      break;

    case "scatter":
      // 随机散落
      const usedAreas = [];

      for (let i = 0; i < count; i++) {
        let x,
          y,
          attempts = 0;
        const maxAttempts = 50;

        // 尝试找到不重叠的位置
        do {
          x = padding + Math.random() * availableWidth;
          y = padding + Math.random() * availableHeight;
          attempts++;
        } while (
          isOverlapping(x, y, photoWidth * 0.8, photoHeight * 0.8, usedAreas) &&
          attempts < maxAttempts
        );

        usedAreas.push({ x, y, width: photoWidth, height: photoHeight });

        positions.push({
          x: x,
          y: y,
          rotation: (Math.random() - 0.5) * 30, // 较大的随机旋转
        });
      }
      break;

    default:
      // 默认网格
      return calculateLayoutPositions(
        "grid",
        count,
        wallWidth,
        wallHeight,
        photoWidth,
        photoHeight
      );
  }

  return positions;
}

/**
 * 检查位置是否重叠
 */
function isOverlapping(x, y, width, height, usedAreas) {
  for (const area of usedAreas) {
    if (
      x < area.x + area.width &&
      x + width > area.x &&
      y < area.y + area.height &&
      y + height > area.y
    ) {
      return true;
    }
  }
  return false;
}

// ==================== 弹窗功能 ====================
/**
 * 打开相纸选择弹窗
 */
function openFrameModal(polaroid) {
  currentEditingPolaroid = polaroid;
  frameModal.style.display = "flex";
}

/**
 * 关闭相纸选择弹窗
 */
function closeFrameModal() {
  frameModal.style.display = "none";
  currentEditingPolaroid = null;

  // 隐藏弹窗内的颜色选择器
  const modalColorPicker = document.getElementById("modalColorPicker");
  if (modalColorPicker) {
    modalColorPicker.style.display = "none";
  }
}

/**
 * 弹窗中选择相纸样式
 */
function selectModalFrame(option) {
  const frame = option.dataset.frame;
  console.log("🎨 弹窗选择相纸样式:", frame);

  if (frame === "custom-modal") {
    modalCustomFrameInput.click();
    return;
  }

  // 如果选择纯色，显示颜色选择器
  if (frame === "solid-color-modal") {
    const modalColorPicker = document.getElementById("modalColorPicker");
    if (modalColorPicker) {
      modalColorPicker.style.display = "block";
    }
    return;
  } else {
    // 隐藏颜色选择器
    const modalColorPicker = document.getElementById("modalColorPicker");
    if (modalColorPicker) {
      modalColorPicker.style.display = "none";
    }
  }

  if (currentEditingPolaroid) {
    const inner = currentEditingPolaroid.querySelector(".polaroid-inner");

    // 移除所有相纸样式类和自定义背景
    inner.classList.remove(
      "frame-bear",
      "frame-rainbow",
      "frame-flower",
      "frame-custom",
      "frame-ocean",
      "frame-candy",
      "frame-lavender",
      "frame-lemon",
      "frame-mint",
      "frame-solid-color"
    );
    inner.style.backgroundImage = "";
    inner.style.backgroundColor = "";
    inner.removeAttribute("data-custom");
    inner.removeAttribute("data-solid-color");

    // 添加新样式
    inner.classList.add(`frame-${frame}`);

    console.log("✅ 照片相纸已更换为:", frame);
  }

  closeFrameModal();
}

// ==================== 照片墙功能 ====================
/**
 * 添加照片到照片墙
 */
function addPhotoToWall(imageData) {
  console.log("🖼️ 添加照片到照片墙，使用相纸样式:", currentFrame);

  // 隐藏空状态提示
  const emptyState = photoWall.querySelector(".empty-state");
  if (emptyState) {
    emptyState.style.display = "none";
  }

  // 增加最大z-index
  maxZIndex++;

  // 创建拍立得元素
  const polaroid = document.createElement("div");
  polaroid.className = "polaroid photo-pop";
  polaroid.id = `photo-${++photoCounter}`;
  polaroid.style.zIndex = maxZIndex; // 新照片层级最高

  // 随机位置和旋转（使用像素定位）
  const wallWidth = photoWall.offsetWidth;
  const wallHeight = photoWall.offsetHeight;
  const maxX = Math.max(50, wallWidth - 220); // 留出照片宽度
  const maxY = Math.max(50, wallHeight - 270); // 留出照片高度
  const randomX = Math.random() * maxX + 10;
  const randomY = Math.random() * maxY + 10;
  const randomRotate = (Math.random() - 0.5) * 20; // -10度到10度

  polaroid.style.left = randomX + "px";
  polaroid.style.top = randomY + "px";
  polaroid.style.setProperty("--rotate", `${randomRotate}deg`);
  polaroid.dataset.rotation = randomRotate;

  // 动画结束后设置最终旋转
  setTimeout(() => {
    polaroid.classList.remove("photo-pop");
    polaroid.style.transform = `rotate(${randomRotate}deg)`;
  }, 600);

  // 创建拍立得内容
  const inner = document.createElement("div");
  inner.className = "polaroid-inner";

  // 应用相纸样式
  if (currentFrame === "custom" && customFrameUrl) {
    inner.classList.add("frame-custom");
    inner.style.backgroundImage = `url(${customFrameUrl})`;
    inner.style.backgroundSize = "cover";
    inner.style.backgroundPosition = "center";
    inner.setAttribute("data-custom", "true");
  } else if (currentFrame === "solid-color") {
    inner.classList.add("frame-solid-color");
    inner.style.backgroundColor = currentFrameColor;
    inner.setAttribute("data-solid-color", currentFrameColor);
  } else {
    inner.classList.add(`frame-${currentFrame}`);
  }

  // 创建图片
  const img = document.createElement("img");
  img.className = "polaroid-img";
  img.src = imageData;

  // 创建底部文字区域
  const captionArea = document.createElement("div");
  captionArea.className = "polaroid-caption";

  // 文字输入容器（包含输入框和样式按钮）
  const captionRow = document.createElement("div");
  captionRow.className = "caption-row";

  // 文字输入框
  const captionInput = document.createElement("input");
  captionInput.type = "text";
  captionInput.className = "caption-input";
  captionInput.placeholder = "写点什么...";
  captionInput.maxLength = 20;
  // 阻止拖拽事件冒泡，让输入框可以正常使用
  captionInput.addEventListener("mousedown", (e) => e.stopPropagation());
  captionInput.addEventListener("touchstart", (e) => e.stopPropagation());

  // 文字样式按钮
  const styleBtn = document.createElement("button");
  styleBtn.className = "caption-style-btn";
  styleBtn.innerHTML = "🎨";
  styleBtn.title = "文字样式";
  styleBtn.addEventListener("mousedown", (e) => e.stopPropagation());
  styleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openCaptionStyleModal(polaroid);
  });

  captionRow.appendChild(captionInput);
  captionRow.appendChild(styleBtn);

  // 日期输入框（可编辑）
  const dateInput = document.createElement("input");
  dateInput.type = "text";
  dateInput.className = "caption-date-input";
  const now = new Date();
  dateInput.value = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(now.getDate()).padStart(2, "0")}`;
  dateInput.placeholder = "日期（可选）";
  dateInput.maxLength = 15;
  dateInput.addEventListener("mousedown", (e) => e.stopPropagation());
  dateInput.addEventListener("touchstart", (e) => e.stopPropagation());

  captionArea.appendChild(captionRow);
  captionArea.appendChild(dateInput);

  // 创建控制按钮
  const controls = document.createElement("div");
  controls.className = "polaroid-controls";

  // 单独保存照片按钮（不带相纸）
  const savePhotoOnlyBtn = document.createElement("button");
  savePhotoOnlyBtn.className = "control-btn";
  savePhotoOnlyBtn.innerHTML = "📷";
  savePhotoOnlyBtn.title = "保存照片";
  savePhotoOnlyBtn.onclick = (e) => {
    e.stopPropagation();
    savePhotoOnly(polaroid);
  };

  // 保存相纸按钮
  const saveBtn = document.createElement("button");
  saveBtn.className = "control-btn";
  saveBtn.innerHTML = "🖼️";
  saveBtn.title = "保存相纸";
  saveBtn.onclick = (e) => {
    e.stopPropagation();
    savePhoto(polaroid);
  };

  // 换相纸按钮
  const frameBtn = document.createElement("button");
  frameBtn.className = "control-btn";
  frameBtn.innerHTML = "🎨";
  frameBtn.title = "更换相纸样式";
  frameBtn.onclick = (e) => {
    e.stopPropagation();
    openFrameModal(polaroid);
  };

  // 删除按钮
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "control-btn";
  deleteBtn.innerHTML = "🗑️";
  deleteBtn.title = "删除这张照片";
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deletePhoto(polaroid);
  };

  controls.appendChild(savePhotoOnlyBtn);
  controls.appendChild(saveBtn);
  controls.appendChild(frameBtn);
  controls.appendChild(deleteBtn);

  // 创建旋转手柄
  const rotateHandle = document.createElement("div");
  rotateHandle.className = "rotate-handle";
  rotateHandle.innerHTML = "🔄";
  rotateHandle.title = "拖动旋转";

  // 创建缩放手柄
  const resizeHandleNW = document.createElement("div");
  resizeHandleNW.className = "resize-handle resize-handle-nw";
  resizeHandleNW.title = "拖动缩放";

  const resizeHandleNE = document.createElement("div");
  resizeHandleNE.className = "resize-handle resize-handle-ne";
  resizeHandleNE.title = "拖动缩放";

  const resizeHandleSW = document.createElement("div");
  resizeHandleSW.className = "resize-handle resize-handle-sw";
  resizeHandleSW.title = "拖动缩放";

  const resizeHandleSE = document.createElement("div");
  resizeHandleSE.className = "resize-handle resize-handle-se";
  resizeHandleSE.title = "拖动缩放";

  // 组装元素
  inner.appendChild(img);
  inner.appendChild(captionArea);
  polaroid.appendChild(inner);
  polaroid.appendChild(controls);
  polaroid.appendChild(rotateHandle);
  polaroid.appendChild(resizeHandleNW);
  polaroid.appendChild(resizeHandleNE);
  polaroid.appendChild(resizeHandleSW);
  polaroid.appendChild(resizeHandleSE);
  photoWall.appendChild(polaroid);

  // 添加拖拽事件
  makeDraggable(polaroid);

  // 添加旋转事件
  makeRotatable(polaroid, rotateHandle);

  // 添加缩放事件
  makeResizable(polaroid);

  // 添加滚轮旋转
  addWheelRotation(polaroid);

  console.log(`✨ 照片 ${polaroid.id} 已添加到照片墙`);
}

/**
 * 使元素可拖拽
 */
function makeDraggable(element) {
  element.addEventListener("mousedown", startDrag);
  element.addEventListener("touchstart", startDrag, { passive: false });
}

/**
 * 开始拖拽
 */
function startDrag(e) {
  // 如果点击的是控制按钮、旋转手柄或缩放手柄，不开始拖拽
  if (
    e.target.closest(".polaroid-controls") ||
    e.target.closest(".rotate-handle") ||
    e.target.closest(".resize-handle")
  ) {
    return;
  }

  // 如果正在旋转或缩放，不开始拖拽
  if (isRotating || isResizingPhoto) return;

  e.preventDefault();

  draggedElement = this;
  draggedElement.classList.add("dragging");

  // 提升层级 - 拖动的照片层级最高
  maxZIndex++;
  draggedElement.style.zIndex = maxZIndex;

  // 获取父容器的位置和尺寸
  const parentRect = photoWall.getBoundingClientRect();
  const wallWidth = photoWall.offsetWidth;
  const wallHeight = photoWall.offsetHeight;

  // 获取元素当前的left/top位置，处理百分比和像素两种情况
  let currentLeft, currentTop;
  const leftStyle = draggedElement.style.left;
  const topStyle = draggedElement.style.top;

  if (leftStyle.includes("%")) {
    // 百分比转像素
    currentLeft = (parseFloat(leftStyle) / 100) * wallWidth;
  } else {
    currentLeft = parseFloat(leftStyle) || 0;
  }

  if (topStyle.includes("%")) {
    // 百分比转像素
    currentTop = (parseFloat(topStyle) / 100) * wallHeight;
  } else {
    currentTop = parseFloat(topStyle) || 0;
  }

  // 立即将位置设置为像素值，避免后续计算问题
  draggedElement.style.left = currentLeft + "px";
  draggedElement.style.top = currentTop + "px";

  // 获取鼠标/触摸位置
  let clientX, clientY;
  if (e.type === "mousedown") {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  // 计算鼠标相对于父容器的位置，然后减去元素的left/top得到偏移
  offsetX = clientX - parentRect.left - currentLeft;
  offsetY = clientY - parentRect.top - currentTop;

  // 添加移动和结束事件
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchmove", drag, { passive: false });
  document.addEventListener("touchend", stopDrag);

  console.log("🖐️ 开始拖拽照片:", draggedElement.id);
}

/**
 * 拖拽中
 */
function drag(e) {
  if (!draggedElement) return;

  e.preventDefault();

  const parentRect = photoWall.getBoundingClientRect();
  let clientX, clientY;

  if (e.type === "mousemove") {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  // 计算新位置：鼠标相对于父容器的位置减去偏移量
  let newX = clientX - parentRect.left - offsetX;
  let newY = clientY - parentRect.top - offsetY;

  // 限制在照片墙范围内（允许稍微超出边界）
  const maxX = photoWall.offsetWidth - draggedElement.offsetWidth;
  const maxY = photoWall.offsetHeight - draggedElement.offsetHeight;

  newX = Math.max(-50, Math.min(newX, maxX + 50));
  newY = Math.max(-50, Math.min(newY, maxY + 50));

  draggedElement.style.left = newX + "px";
  draggedElement.style.top = newY + "px";
}

/**
 * 停止拖拽
 */
function stopDrag() {
  if (draggedElement) {
    draggedElement.classList.remove("dragging");
    console.log("✅ 停止拖拽照片:", draggedElement.id);
    draggedElement = null;
  }

  // 移除事件监听
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("touchend", stopDrag);
}

/**
 * 使元素可旋转
 */
function makeRotatable(element, handle) {
  handle.addEventListener("mousedown", (e) => startRotate(e, element));
  handle.addEventListener("touchstart", (e) => startRotate(e, element), {
    passive: false,
  });
}

/**
 * 开始旋转
 */
function startRotate(e, element) {
  e.preventDefault();
  e.stopPropagation();

  isRotating = true;
  rotatingElement = element;

  // 提升层级
  maxZIndex++;
  element.style.zIndex = maxZIndex;

  // 获取元素中心点
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 获取当前旋转角度
  currentRotation = parseFloat(element.dataset.rotation) || 0;

  // 计算起始角度
  let clientX, clientY;
  if (e.type === "mousedown") {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  startAngle =
    (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;

  document.addEventListener("mousemove", rotate);
  document.addEventListener("mouseup", stopRotate);
  document.addEventListener("touchmove", rotate, { passive: false });
  document.addEventListener("touchend", stopRotate);
}

/**
 * 旋转中
 */
function rotate(e) {
  if (!rotatingElement) return;

  e.preventDefault();

  const rect = rotatingElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let clientX, clientY;
  if (e.type === "mousemove") {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  const currentAngle =
    (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
  const angleDiff = currentAngle - startAngle;
  const newRotation = currentRotation + angleDiff;

  rotatingElement.style.transform = `rotate(${newRotation}deg)`;
  rotatingElement.dataset.rotation = newRotation;
}

/**
 * 停止旋转
 */
function stopRotate() {
  isRotating = false;
  rotatingElement = null;

  document.removeEventListener("mousemove", rotate);
  document.removeEventListener("mouseup", stopRotate);
  document.removeEventListener("touchmove", rotate);
  document.removeEventListener("touchend", stopRotate);
}

/**
 * 添加滚轮旋转
 */
function addWheelRotation(element) {
  element.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      // 提升层级
      maxZIndex++;
      element.style.zIndex = maxZIndex;

      let rotation = parseFloat(element.dataset.rotation) || 0;
      rotation += e.deltaY > 0 ? 5 : -5;

      element.style.transform = `rotate(${rotation}deg)`;
      element.dataset.rotation = rotation;
    },
    { passive: false }
  );
}

/**
 * 使元素可缩放
 */
function makeResizable(element) {
  const handles = element.querySelectorAll(".resize-handle");
  handles.forEach((handle) => {
    handle.addEventListener("mousedown", (e) =>
      startPhotoResize(e, element, handle)
    );
    handle.addEventListener(
      "touchstart",
      (e) => startPhotoResize(e, element, handle),
      { passive: false }
    );
  });
}

/**
 * 开始缩放照片
 */
function startPhotoResize(e, element, handle) {
  e.preventDefault();
  e.stopPropagation();

  isResizingPhoto = true;
  resizingPhoto = element;
  resizePhotoHandle = handle;

  // 提升层级
  maxZIndex++;
  element.style.zIndex = maxZIndex;

  if (e.type === "mousedown") {
    resizePhotoStartX = e.clientX;
    resizePhotoStartY = e.clientY;
  } else {
    resizePhotoStartX = e.touches[0].clientX;
    resizePhotoStartY = e.touches[0].clientY;
  }

  // 获取当前缩放比例
  const currentScale = parseFloat(element.dataset.scale) || 1;
  resizePhotoStartW = POLAROID_WIDTH * currentScale;
  resizePhotoStartH = POLAROID_HEIGHT * currentScale;
  resizePhotoStartLeft = parseFloat(element.style.left) || 0;
  resizePhotoStartTop = parseFloat(element.style.top) || 0;

  document.addEventListener("mousemove", doPhotoResize);
  document.addEventListener("mouseup", stopPhotoResize);
  document.addEventListener("touchmove", doPhotoResize, { passive: false });
  document.addEventListener("touchend", stopPhotoResize);
}

/**
 * 缩放照片中
 */
function doPhotoResize(e) {
  if (!isResizingPhoto || !resizingPhoto) return;
  e.preventDefault();

  let clientX, clientY;
  if (e.type === "mousemove") {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }

  const dx = clientX - resizePhotoStartX;
  const dy = clientY - resizePhotoStartY;

  const handleClass = resizePhotoHandle.className;

  // 保持相纸宽高比例 (170:240)
  const aspectRatio = POLAROID_WIDTH / POLAROID_HEIGHT;
  let newWidth = resizePhotoStartW;
  let newHeight = resizePhotoStartH;
  let newLeft = resizePhotoStartLeft;
  let newTop = resizePhotoStartTop;

  // 根据不同角落计算新尺寸，保持比例
  // 最小尺寸为原始尺寸 170x240，最大为2倍
  const minWidth = POLAROID_WIDTH;
  const maxWidth = POLAROID_WIDTH * 2;

  if (handleClass.includes("se")) {
    // 使用较大的变化量来计算
    const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy * aspectRatio;
    newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, resizePhotoStartW + delta)
    );
    newHeight = newWidth / aspectRatio;
  } else if (handleClass.includes("sw")) {
    const delta = Math.abs(dx) > Math.abs(dy) ? -dx : dy * aspectRatio;
    newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, resizePhotoStartW + delta)
    );
    newHeight = newWidth / aspectRatio;
    newLeft = resizePhotoStartLeft + (resizePhotoStartW - newWidth);
  } else if (handleClass.includes("ne")) {
    const delta = Math.abs(dx) > Math.abs(dy) ? dx : -dy * aspectRatio;
    newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, resizePhotoStartW + delta)
    );
    newHeight = newWidth / aspectRatio;
    newTop = resizePhotoStartTop + (resizePhotoStartH - newHeight);
  } else if (handleClass.includes("nw")) {
    const delta = Math.abs(dx) > Math.abs(dy) ? -dx : -dy * aspectRatio;
    newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, resizePhotoStartW + delta)
    );
    newHeight = newWidth / aspectRatio;
    newLeft = resizePhotoStartLeft + (resizePhotoStartW - newWidth);
    newTop = resizePhotoStartTop + (resizePhotoStartH - newHeight);
  }

  // 计算缩放比例
  const scale = newWidth / POLAROID_WIDTH;

  // 应用新尺寸到相纸 - 使用transform缩放整个相纸
  const inner = resizingPhoto.querySelector(".polaroid-inner");
  inner.style.transform = `scale(${scale})`;
  inner.style.transformOrigin = "top left";

  // 更新位置
  resizingPhoto.style.left = newLeft + "px";
  resizingPhoto.style.top = newTop + "px";

  // 更新缩放手柄位置
  updateResizeHandlePositions(resizingPhoto, scale);

  // 更新旋转手柄位置
  const rotateHandle = resizingPhoto.querySelector(".rotate-handle");
  if (rotateHandle) {
    rotateHandle.style.bottom = -30 + "px";
    rotateHandle.style.left = newWidth / 2 + "px";
  }

  // 保存当前缩放比例到dataset
  resizingPhoto.dataset.scale = scale;
}

/**
 * 停止缩放照片
 */
function stopPhotoResize() {
  isResizingPhoto = false;
  resizingPhoto = null;
  resizePhotoHandle = null;

  document.removeEventListener("mousemove", doPhotoResize);
  document.removeEventListener("mouseup", stopPhotoResize);
  document.removeEventListener("touchmove", doPhotoResize);
  document.removeEventListener("touchend", stopPhotoResize);
}

/**
 * 更新缩放手柄位置
 */
function updateResizeHandlePositions(polaroid, scale) {
  const scaledWidth = POLAROID_WIDTH * scale;
  const scaledHeight = POLAROID_HEIGHT * scale;

  const handleNW = polaroid.querySelector(".resize-handle-nw");
  const handleNE = polaroid.querySelector(".resize-handle-ne");
  const handleSW = polaroid.querySelector(".resize-handle-sw");
  const handleSE = polaroid.querySelector(".resize-handle-se");

  if (handleNW) {
    handleNW.style.top = "-8px";
    handleNW.style.left = "-8px";
  }
  if (handleNE) {
    handleNE.style.top = "-8px";
    handleNE.style.left = scaledWidth - 8 + "px";
    handleNE.style.right = "auto";
  }
  if (handleSW) {
    handleSW.style.top = scaledHeight - 8 + "px";
    handleSW.style.bottom = "auto";
    handleSW.style.left = "-8px";
  }
  if (handleSE) {
    handleSE.style.top = scaledHeight - 8 + "px";
    handleSE.style.bottom = "auto";
    handleSE.style.left = scaledWidth - 8 + "px";
    handleSE.style.right = "auto";
  }
}

// ==================== 导出功能 ====================
/**
 * 保存单张照片（使用Canvas绘制，确保像素正确）
 */
async function savePhoto(polaroid) {
  console.log("💾 保存单张照片:", polaroid.id);

  try {
    const img = polaroid.querySelector(".polaroid-img");
    const inner = polaroid.querySelector(".polaroid-inner");
    const captionInput = polaroid.querySelector(".caption-input");
    const dateSpan = polaroid.querySelector(".caption-date");

    // 获取照片的缩放比例
    const scale = parseFloat(polaroid.dataset.scale) || 1;
    
    // 计算实际尺寸
    const totalWidth = POLAROID_WIDTH * scale;
    const totalHeight = POLAROID_HEIGHT * scale;
    const photoWidth = PHOTO_WIDTH * scale;
    const photoHeight = PHOTO_HEIGHT * scale;
    
    // 计算内边距（按比例调整）
    const paddingSide = FRAME_PADDING_SIDE * scale;
    const paddingTop = FRAME_PADDING_TOP * scale;
    const paddingBottom = FRAME_PADDING_BOTTOM * scale;

    // 创建导出用的canvas
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = totalWidth * 2; // 2倍分辨率
    exportCanvas.height = totalHeight * 2;

    const ctx = exportCanvas.getContext("2d");
    ctx.scale(2, 2);

    // 绘制相纸背景（按比例缩放）
    await drawFrameBackground(ctx, inner, totalWidth, totalHeight);

    // 绘制照片
    const photoImg = new Image();
    photoImg.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      photoImg.onload = resolve;
      photoImg.onerror = reject;
      photoImg.src = img.src;
    });

    // 计算居中位置
    const photoX = paddingSide;
    const photoY = paddingTop;

    // 保持原始照片的宽高比，就像在卡片中显示一样 (object-fit: cover)
     const naturalWidth = photoImg.naturalWidth;
     const naturalHeight = photoImg.naturalHeight;
     const targetWidth = photoWidth;
     const targetHeight = photoHeight;
     
     let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
     
     // 计算如何裁剪图片以填充目标区域（保持object-fit: cover效果）
     const scaleX = targetWidth / naturalWidth;
     const scaleY = targetHeight / naturalHeight;
     const imageScale = Math.max(scaleX, scaleY); // 取较大的缩放比例以填满目标区域
     
     drawWidth = naturalWidth * imageScale;
     drawHeight = naturalHeight * imageScale;
     
     // 计算偏移量以居中显示
     offsetX = (targetWidth - drawWidth) / 2;
     offsetY = (targetHeight - drawHeight) / 2;

    // 绘制照片（带圆角）
    ctx.save();
    roundRect(
      ctx,
      photoX,
      photoY,
      photoWidth,
      photoHeight,
      3 * scale
    );
    ctx.clip();
    ctx.drawImage(
      photoImg,
      photoX + offsetX,
      photoY + offsetY,
      drawWidth,
      drawHeight
    );
    ctx.restore();

    // 绘制相纸装饰（按比例缩放）
    await drawFrameDecorations(ctx, inner, totalWidth, totalHeight);

    // 绘制用户输入的文字
    if (captionInput && captionInput.value) {
      // 获取文字样式
      const fontFamily = captionInput.style.fontFamily || "Nunito, sans-serif";
      const fontColor = captionInput.style.color || "#666666";
      const fontStyle = captionInput.style.fontStyle || "normal";

      ctx.font = `${fontStyle} 600 ${11 * scale}px ${fontFamily}`;
      ctx.fillStyle = fontColor;
      ctx.textAlign = "center";
      // 调整文字位置，使其更靠近相纸底部但不过于靠下
      ctx.fillText(captionInput.value, totalWidth / 2, totalHeight - 35 * scale);
    }

    // 绘制日期
    const dateInput = polaroid.querySelector(".caption-date-input");
    if (dateInput && dateInput.value) {
      const fontFamily = dateInput.style.fontFamily || "Nunito, sans-serif";
      const fontColor = dateInput.style.color || "#999999";
      const fontStyle = dateInput.style.fontStyle || "normal";

      ctx.font = `${fontStyle} ${9 * scale}px ${fontFamily}`;
      ctx.fillStyle = fontColor;
      ctx.globalAlpha = parseFloat(dateInput.style.opacity) || 0.7;
      ctx.textAlign = "center";
      // 调整日期位置，使其更靠近相纸底部但不过于靠下
      ctx.fillText(dateInput.value, totalWidth / 2, totalHeight - 20 * scale);
      ctx.globalAlpha = 1;
    }

    // 下载图片
    const link = document.createElement("a");
    link.download = `可爱拍立得-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();

    console.log("✨ 照片保存成功！");
  } catch (error) {
    console.error("❌ 保存照片失败:", error);
    alert("保存照片失败，请重试 🥺\n错误信息: " + error.message);
  }
}

/**
 * 绘制圆角矩形路径
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 绘制相纸背景
 */
async function drawFrameBackground(ctx, inner, width, height) {
  // 绘制矩形背景（无圆角）
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  // 检查是否是自定义背景
  if (
    inner.getAttribute("data-custom") === "true" &&
    inner.style.backgroundImage
  ) {
    // 绘制自定义背景图片
    const bgUrl = inner.style.backgroundImage.replace(
      /url\(['"]?(.+?)['"]?\)/,
      "$1"
    );
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";

    await new Promise((resolve) => {
      bgImg.onload = resolve;
      bgImg.onerror = resolve;
      bgImg.src = bgUrl;
    });

    ctx.drawImage(bgImg, 0, 0, width, height);
  } else if (inner.classList.contains("frame-bear")) {
    // 小熊相纸渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#FFF5E6");
    gradient.addColorStop(1, "#FFE4C4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 边框（无圆角）
    ctx.strokeStyle = "#DEB887";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(1, 1, width - 2, height - 2);
    ctx.stroke();
  } else if (inner.classList.contains("frame-rainbow")) {
    // 彩虹相纸
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(255, 154, 158, 0.3)");
    gradient.addColorStop(0.2, "rgba(254, 207, 239, 0.3)");
    gradient.addColorStop(0.4, "rgba(255, 236, 210, 0.3)");
    gradient.addColorStop(0.6, "rgba(168, 237, 234, 0.3)");
    gradient.addColorStop(0.8, "rgba(210, 153, 194, 0.3)");
    gradient.addColorStop(1, "rgba(254, 249, 215, 0.3)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#fecfef";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(1, 1, width - 2, height - 2);
    ctx.stroke();
  } else if (inner.classList.contains("frame-flower")) {
    // 樱花相纸
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#FFE4EC");
    gradient.addColorStop(1, "#FFCCD5");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#FFB6C1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(1, 1, width - 2, height - 2);
    ctx.stroke();
  } else if (inner.classList.contains("frame-solid-color")) {
    // 纯色相纸
    const solidColor =
      inner.getAttribute("data-solid-color") ||
      inner.style.backgroundColor ||
      "#FFFFFF";
    ctx.fillStyle = solidColor;
    ctx.fillRect(0, 0, width, height);

    // 添加淡淡的边框（无圆角）
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(1, 1, width - 2, height - 2);
    ctx.stroke();
  } else {
    // 默认白色
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

/**
 * 绘制相纸装饰
 */
async function drawFrameDecorations(ctx, inner, width, height) {
  // 装饰位置在照片下方，文字输入区上方 (约y=205的位置)
  const decoY = FRAME_PADDING_TOP + PHOTO_HEIGHT + 12;

  if (
    inner.classList.contains("frame-bear") &&
    !inner.getAttribute("data-custom")
  ) {
    ctx.font = "16px Arial";
    ctx.fillText("🧸", 10, decoY);
    ctx.font = "9px Arial";
    ctx.fillText("🐾 🐾", width - 35, decoY);
  } else if (
    inner.classList.contains("frame-rainbow") &&
    !inner.getAttribute("data-custom")
  ) {
    ctx.font = "16px Arial";
    ctx.fillText("🌈", 10, decoY);
    ctx.font = "11px Arial";
    ctx.fillText("✨💖", width - 35, decoY);
  } else if (
    inner.classList.contains("frame-flower") &&
    !inner.getAttribute("data-custom")
  ) {
    ctx.font = "16px Arial";
    ctx.fillText("🌸", 10, decoY);
    ctx.font = "14px Arial";
    ctx.fillText("🌸", width - 25, decoY);
  } else if (
    inner.classList.contains("frame-ocean") &&
    !inner.getAttribute("data-custom")
  ) {
    ctx.font = "16px Arial";
    ctx.fillText("🐚", 10, decoY);
    ctx.font = "14px Arial";
    ctx.fillText("🐠", width - 25, decoY);
  } else if (
    inner.classList.contains("frame-candy") &&
    !inner.getAttribute("data-custom")
  ) {
    ctx.font = "16px Arial";
    ctx.fillText("🍬", 10, decoY);
    ctx.font = "14px Arial";
    ctx.fillText("🍭", width - 25, decoY);
  } else if (
    inner.classList.contains("frame-lavender") &&
    !inner.getAttribute("data-custom")
  ) {
    ctx.font = "16px Arial";
    ctx.fillText("💜", 10, decoY);
    ctx.font = "14px Arial";
    ctx.fillStyle = "#9C27B0";
    ctx.fillText("✿", width - 25, decoY);
    ctx.fillStyle = "#000";
  } else if (
    inner.classList.contains("frame-lemon") &&
    !inner.getAttribute("data-custom")
  ) {
    ctx.font = "16px Arial";
    ctx.fillText("🍋", 10, decoY);
    ctx.font = "14px Arial";
    ctx.fillText("☀️", width - 25, decoY);
  } else if (
    inner.classList.contains("frame-mint") &&
    !inner.getAttribute("data-custom")
  ) {
    ctx.font = "16px Arial";
    ctx.fillText("🍃", 10, decoY);
    ctx.font = "14px Arial";
    ctx.fillText("🌿", width - 25, decoY);
  }
}

/**
 * 保存整个照片墙
 */
async function savePhotoWall() {
  console.log("💾 保存整个照片墙...");

  // 检查是否有照片
  const photos = photoWall.querySelectorAll(".polaroid");
  if (photos.length === 0) {
    alert("照片墙还是空的哦，先拍几张照片吧~ 📷✨");
    return;
  }

  try {
    // 创建导出用的canvas，大小为照片墙的实际尺寸
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = photoWall.offsetWidth * 2; // 2倍分辨率
    exportCanvas.height = photoWall.offsetHeight * 2;
    
    const ctx = exportCanvas.getContext("2d");
    ctx.scale(2, 2);
    
    // 绘制照片墙背景
    drawPhotoWallBackground(ctx, photoWall.offsetWidth, photoWall.offsetHeight);
    
    // 获取背景类型并绘制装饰元素
    let bgType = "starry"; // 默认星空背景
    const photoWallClasses = photoWall.className;
    if (photoWallClasses.includes("bg-cloud-wall")) {
      bgType = "cloud";
    } else if (photoWallClasses.includes("bg-sunset-wall")) {
      bgType = "sunset";
    } else if (photoWallClasses.includes("bg-aurora-wall")) {
      bgType = "aurora";
    } else if (photoWallClasses.includes("bg-beach-wall")) {
      bgType = "beach";
    } else if (photoWallClasses.includes("bg-forest-wall")) {
      bgType = "forest";
    } else if (photoWallClasses.includes("bg-cherry-wall")) {
      bgType = "cherry";
    } else if (photoWallClasses.includes("bg-meadow-wall")) {
      bgType = "meadow";
    }
    
    // 绘制背景装饰元素
    drawWallDecorations(ctx, photoWall.offsetWidth, photoWall.offsetHeight, bgType);

    // 遍历所有照片，按照单个相纸保存的方式绘制每一张
    for (const polaroid of photos) {
      const img = polaroid.querySelector(".polaroid-img");
      const inner = polaroid.querySelector(".polaroid-inner");
      const captionInput = polaroid.querySelector(".caption-input");
      const dateSpan = polaroid.querySelector(".caption-date");
      
      // 获取照片的位置和变换信息
      const rect = polaroid.getBoundingClientRect();
      const wallRect = photoWall.getBoundingClientRect();
      const x = rect.left - wallRect.left;
      const y = rect.top - wallRect.top;
      
      // 获取照片的缩放比例
      const scale = parseFloat(polaroid.dataset.scale) || 1;
      
      // 计算实际尺寸
      const totalWidth = POLAROID_WIDTH * scale;
      const totalHeight = POLAROID_HEIGHT * scale;
      const photoWidth = PHOTO_WIDTH * scale;
      const photoHeight = PHOTO_HEIGHT * scale;
      
      // 计算内边距（按比例调整）
      const paddingSide = FRAME_PADDING_SIDE * scale;
      const paddingTop = FRAME_PADDING_TOP * scale;
      const paddingBottom = FRAME_PADDING_BOTTOM * scale;

      // 保存当前上下文
      ctx.save();
      // 应用照片的位置和变换
      ctx.translate(x, y);
      
      // 获取旋转角度
      const rotation = parseFloat(polaroid.dataset.rotation) || 0;
      if (rotation !== 0) {
        ctx.translate(totalWidth / 2, totalHeight / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-totalWidth / 2, -totalHeight / 2);
      }

      // 绘制相纸背景（按比例缩放）
      await drawFrameBackground(ctx, inner, totalWidth, totalHeight);

      // 绘制照片
      if (img && img.src) {
        const photoImg = new Image();
        photoImg.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          photoImg.onload = resolve;
          photoImg.onerror = reject;
          photoImg.src = img.src;
        });

        // 计算居中位置
        const photoX = paddingSide;
        const photoY = paddingTop;

        // 保持原始照片的宽高比，就像在卡片中显示一样 (object-fit: cover)
        const naturalWidth = photoImg.naturalWidth;
        const naturalHeight = photoImg.naturalHeight;
        const targetWidth = photoWidth;
        const targetHeight = photoHeight;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        // 计算如何裁剪图片以填充目标区域（保持object-fit: cover效果）
        const scaleX = targetWidth / naturalWidth;
        const scaleY = targetHeight / naturalHeight;
        const imageScale = Math.max(scaleX, scaleY); // 取较大的缩放比例以填满目标区域
        
        drawWidth = naturalWidth * imageScale;
        drawHeight = naturalHeight * imageScale;
        
        // 计算偏移量以居中显示
        offsetX = (targetWidth - drawWidth) / 2;
        offsetY = (targetHeight - drawHeight) / 2;

        // 绘制照片（带圆角）
        ctx.save();
        roundRect(
          ctx,
          photoX,
          photoY,
          photoWidth,
          photoHeight,
          3 * scale
        );
        ctx.clip();
        ctx.drawImage(
          photoImg,
          photoX + offsetX,
          photoY + offsetY,
          drawWidth,
          drawHeight
        );
        ctx.restore();
      }

      // 绘制相纸装饰（按比例缩放）
      await drawFrameDecorations(ctx, inner, totalWidth, totalHeight);

      // 绘制用户输入的文字
      if (captionInput && captionInput.value) {
        // 获取文字样式
        const fontFamily = captionInput.style.fontFamily || "Nunito, sans-serif";
        const fontColor = captionInput.style.color || "#666666";
        const fontStyle = captionInput.style.fontStyle || "normal";

        ctx.font = `${fontStyle} 600 ${11 * scale}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = "center";
        // 调整文字位置，使其更靠近相纸底部但不过于靠下
        ctx.fillText(captionInput.value, totalWidth / 2, totalHeight - 35 * scale);
      }

      // 绘制日期
      const dateInput = polaroid.querySelector(".caption-date-input");
      if (dateInput && dateInput.value) {
        const fontFamily = dateInput.style.fontFamily || "Nunito, sans-serif";
        const fontColor = dateInput.style.color || "#999999";
        const fontStyle = dateInput.style.fontStyle || "normal";

        ctx.font = `${fontStyle} ${9 * scale}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.globalAlpha = parseFloat(dateInput.style.opacity) || 0.7;
        ctx.textAlign = "center";
        // 调整日期位置，使其更靠近相纸底部但不过于靠下
        ctx.fillText(dateInput.value, totalWidth / 2, totalHeight - 20 * scale);
        ctx.globalAlpha = 1;
      }

      // 恢复上下文
      ctx.restore();
    }

    // 下载图片
    const link = document.createElement("a");
    link.download = `可爱照片墙-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();

    console.log("✨ 照片墙保存成功！");
  } catch (error) {
    console.error("❌ 保存照片墙失败:", error);
    alert("保存照片墙失败，请重试 🥺\n错误信息: " + error.message);
  }
}

/**
 * 删除照片
 */
function deletePhoto(polaroid) {
  console.log("🗑️ 删除照片:", polaroid.id);

  if (confirm("确定要删除这张可爱的照片吗？🥺")) {
    // 添加消失动画
    polaroid.style.transition = "all 0.3s ease";
    polaroid.style.transform = "scale(0) rotate(180deg)";
    polaroid.style.opacity = "0";

    setTimeout(() => {
      polaroid.remove();

      // 如果没有照片了，显示空状态
      const photos = photoWall.querySelectorAll(".polaroid");
      if (photos.length === 0) {
        const emptyState = photoWall.querySelector(".empty-state");
        if (emptyState) {
          emptyState.style.display = "block";
        }
      }

      console.log("✅ 照片已删除");
    }, 300);
  }
}

// ==================== 文字样式弹窗功能 ====================
/**
 * 初始化文字样式弹窗
 */
function initCaptionStyleModal() {
  if (!captionStyleModal) return;

  const closeBtn = document.getElementById("closeCaptionStyleModal");
  const cancelBtn = document.getElementById("cancelCaptionStyle");
  const applyBtn = document.getElementById("applyCaptionStyle");
  const colorPicker = document.getElementById("captionColorPicker");
  const colorValue = document.getElementById("captionColorValue");
  const preview = document.getElementById("captionPreview");

  // 关闭弹窗
  if (closeBtn) {
    closeBtn.addEventListener("click", closeCaptionStyleModal);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeCaptionStyleModal);
  }
  captionStyleModal.addEventListener("click", (e) => {
    if (e.target === captionStyleModal) closeCaptionStyleModal();
  });

  // 字体选择
  document.querySelectorAll(".font-option").forEach((option) => {
    option.addEventListener("click", () => {
      document
        .querySelectorAll(".font-option")
        .forEach((o) => o.classList.remove("active"));
      option.classList.add("active");
      selectedFont = option.dataset.font;
      updateCaptionPreview();
    });
  });

  // 颜色选择
  document.querySelectorAll(".text-color-option").forEach((option) => {
    option.addEventListener("click", () => {
      document
        .querySelectorAll(".text-color-option")
        .forEach((o) => o.classList.remove("active"));
      option.classList.add("active");
      selectedColor = option.dataset.color;
      if (colorPicker) colorPicker.value = selectedColor;
      if (colorValue) colorValue.textContent = selectedColor;
      updateCaptionPreview();
    });
  });

  // 自定义颜色
  if (colorPicker) {
    colorPicker.addEventListener("input", (e) => {
      selectedColor = e.target.value;
      if (colorValue) colorValue.textContent = selectedColor.toUpperCase();
      document
        .querySelectorAll(".text-color-option")
        .forEach((o) => o.classList.remove("active"));
      updateCaptionPreview();
    });
  }

  // 倾斜选择
  document.querySelectorAll(".italic-option").forEach((option) => {
    option.addEventListener("click", () => {
      document
        .querySelectorAll(".italic-option")
        .forEach((o) => o.classList.remove("active"));
      option.classList.add("active");
      selectedItalic = option.dataset.italic;
      updateCaptionPreview();
    });
  });

  // 应用样式
  if (applyBtn) {
    applyBtn.addEventListener("click", applyCaptionStyle);
  }
}

/**
 * 打开文字样式弹窗
 */
function openCaptionStyleModal(polaroid) {
  currentStylePolaroid = polaroid;

  // 获取当前样式
  const captionInput = polaroid.querySelector(".caption-input");
  if (captionInput) {
    // 读取当前样式
    const currentFont = captionInput.style.fontFamily || "'Nunito', sans-serif";
    const currentColor = captionInput.style.color || "#666666";
    const currentItalic = captionInput.style.fontStyle || "normal";

    selectedFont = currentFont;
    selectedColor = currentColor;
    selectedItalic = currentItalic;

    // 更新选中状态
    document.querySelectorAll(".font-option").forEach((o) => {
      o.classList.toggle("active", o.dataset.font === currentFont);
    });

    document.querySelectorAll(".text-color-option").forEach((o) => {
      o.classList.toggle(
        "active",
        o.dataset.color.toLowerCase() === currentColor.toLowerCase()
      );
    });

    document.querySelectorAll(".italic-option").forEach((o) => {
      o.classList.toggle("active", o.dataset.italic === currentItalic);
    });

    // 更新颜色选择器
    const colorPicker = document.getElementById("captionColorPicker");
    const colorValue = document.getElementById("captionColorValue");
    if (colorPicker) colorPicker.value = currentColor;
    if (colorValue) colorValue.textContent = currentColor.toUpperCase();

    // 更新预览
    updateCaptionPreview();
  }

  captionStyleModal.style.display = "flex";
}

/**
 * 关闭文字样式弹窗
 */
function closeCaptionStyleModal() {
  captionStyleModal.style.display = "none";
  currentStylePolaroid = null;
}

/**
 * 更新预览
 */
function updateCaptionPreview() {
  const preview = document.getElementById("captionPreview");
  if (preview) {
    preview.style.fontFamily = selectedFont;
    preview.style.color = selectedColor;
    preview.style.fontStyle = selectedItalic;
  }
}

/**
 * 应用文字样式
 */
function applyCaptionStyle() {
  if (!currentStylePolaroid) return;

  const captionInput = currentStylePolaroid.querySelector(".caption-input");
  const dateInput = currentStylePolaroid.querySelector(".caption-date-input");

  if (captionInput) {
    captionInput.style.fontFamily = selectedFont;
    captionInput.style.color = selectedColor;
    captionInput.style.fontStyle = selectedItalic;
  }

  // 日期也应用相同颜色（稍微淡一点）
  if (dateInput) {
    dateInput.style.fontFamily = selectedFont;
    dateInput.style.fontStyle = selectedItalic;
    // 日期颜色稍微淡一点
    dateInput.style.color = selectedColor;
    dateInput.style.opacity = "0.7";
  }

  console.log("✅ 文字样式已应用");
  closeCaptionStyleModal();
}

/**
 * 单独保存照片（不带相纸）
 */
async function savePhotoOnly(polaroid) {
  console.log("💾 单独保存照片（不带相纸）:", polaroid.id);

  try {
    const img = polaroid.querySelector(".polaroid-img");

    // 直接从图片的src创建下载链接
    const link = document.createElement("a");
    link.download = `照片-${Date.now()}.png`;
    link.href = img.src;
    link.click();

    console.log("✨ 照片保存成功！");
  } catch (error) {
    console.error("❌ 保存照片失败:", error);
    alert("保存照片失败，请重试 🥺\n错误信息: " + error.message);
  }
}

// ==================== 错误处理 ====================
window.addEventListener("error", (event) => {
  console.error("❌ 全局错误:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("❌ 未处理的Promise拒绝:", event.reason);
});

console.log("🎀 可爱拍立得脚本加载完成！✨");

// ==================== 照片墙背景绘制函数 ====================
/**
 * 绘制照片墙背景
 */
function drawPhotoWallBackground(ctx, width, height) {
  // 获取当前照片墙的背景类名
  const photoWallClasses = photoWall.className;
  
  // 设置默认背景色
  let bgColor = "#ffffff"; // 默认白色背景
  
  // 根据背景类名设置相应的渐变背景
  if (photoWallClasses.includes("bg-starry-wall")) {
    // 星空背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f3460");
    bgColor = gradient;
  } else if (photoWallClasses.includes("bg-cloud-wall")) {
    // 云朵背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#89CFF0");
    gradient.addColorStop(0.5, "#A7D8FF");
    gradient.addColorStop(1, "#C9E4FF");
    bgColor = gradient;
  } else if (photoWallClasses.includes("bg-sunset-wall")) {
    // 晚霞橙背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#FF6B6B");
    gradient.addColorStop(0.3, "#FF8E53");
    gradient.addColorStop(0.6, "#FFA726");
    gradient.addColorStop(1, "#FFD54F");
    bgColor = gradient;
  } else if (photoWallClasses.includes("bg-aurora-wall")) {
    // 极光紫背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0D0D2B");
    gradient.addColorStop(0.2, "#1A1A4E");
    gradient.addColorStop(0.5, "#4A148C");
    gradient.addColorStop(0.7, "#7B1FA2");
    gradient.addColorStop(1, "#E040FB");
    bgColor = gradient;
  } else if (photoWallClasses.includes("bg-beach-wall")) {
    // 沙滩海背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.3, "#87CEEB");
    gradient.addColorStop(0.3, "#00BCD4");
    gradient.addColorStop(0.5, "#00ACC1");
    gradient.addColorStop(0.5, "#F5DEB3");
    gradient.addColorStop(1, "#DEB887");
    bgColor = gradient;
  } else if (photoWallClasses.includes("bg-forest-wall")) {
    // 森林绿背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1B5E20");
    gradient.addColorStop(0.3, "#2E7D32");
    gradient.addColorStop(0.5, "#388E3C");
    gradient.addColorStop(0.7, "#43A047");
    gradient.addColorStop(1, "#66BB6A");
    bgColor = gradient;
  } else if (photoWallClasses.includes("bg-cherry-wall")) {
    // 樱花季背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#FCE4EC");
    gradient.addColorStop(0.3, "#F8BBD9");
    gradient.addColorStop(0.6, "#F48FB1");
    gradient.addColorStop(1, "#F06292");
    bgColor = gradient;
  } else if (photoWallClasses.includes("bg-meadow-wall")) {
    // 草地背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.4, "#87CEEB");
    gradient.addColorStop(0.4, "#98FB98");
    gradient.addColorStop(1, "#7CFC00");
    bgColor = gradient;
  }
  
  // 绘制背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
}

/**
 * 绘制照片墙装饰元素
 */
function drawWallDecorations(ctx, width, height, bgType) {
  ctx.font = "20px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  
  switch (bgType) {
    case "starry":
      // 绘制星星和月亮装饰
      ctx.font = "20px Arial";
      ctx.fillText("⭐", width * 0.15, height * 0.1);
      ctx.font = "16px Arial";
      ctx.fillText("✨", width * 0.8, height * 0.25);
      ctx.font = "18px Arial";
      ctx.fillText("🌟", width * 0.1, height * 0.3);
      ctx.font = "14px Arial";
      ctx.fillText("💫", width * 0.9, height * 0.5);
      ctx.font = "35px Arial";
      ctx.fillText("🌙", width * 0.92, height * 0.08);
      break;
    case "cloud":
      // 绘制云朵和太阳装饰
      ctx.font = "30px Arial";
      ctx.fillText("☁️", width * 0.15, height * 0.1);
      ctx.font = "25px Arial";
      ctx.fillText("☁️", width * 0.8, height * 0.25);
      ctx.font = "35px Arial";
      ctx.fillText("☁️", width * 0.1, height * 0.3);
      ctx.font = "20px Arial";
      ctx.fillText("🦋", width * 0.9, height * 0.5);
      ctx.font = "28px Arial";
      ctx.fillText("🌤️", width * 0.9, height * 0.05);
      break;
    case "meadow":
      // 绘制花朵和蝴蝶装饰
      ctx.font = "24px Arial";
      ctx.fillText("🌼", width * 0.15, height * 0.1);
      ctx.font = "20px Arial";
      ctx.fillText("🌸", width * 0.8, height * 0.25);
      ctx.font = "22px Arial";
      ctx.fillText("🌷", width * 0.1, height * 0.3);
      ctx.font = "18px Arial";
      ctx.fillText("🦋", width * 0.9, height * 0.5);
      ctx.font = "26px Arial";
      ctx.fillText("🌻", width * 0.95, height * 0.05);
      break;
    case "sunset":
      // 绘制日出和鸟儿装饰
      ctx.font = "24px Arial";
      ctx.fillText("🌅", width * 0.15, height * 0.1);
      ctx.font = "20px Arial";
      ctx.fillText("🌇", width * 0.8, height * 0.25);
      ctx.font = "18px Arial";
      ctx.fillText("🐦", width * 0.1, height * 0.3);
      ctx.font = "16px Arial";
      ctx.fillText("🐦", width * 0.9, height * 0.5);
      ctx.font = "35px Arial";
      ctx.fillText("☀️", width * 0.9, height * 0.15);
      break;
    case "aurora":
      // 绘制星空装饰
      ctx.font = "20px Arial";
      ctx.fillText("⭐", width * 0.15, height * 0.1);
      ctx.font = "16px Arial";
      ctx.fillText("✨", width * 0.8, height * 0.25);
      ctx.font = "14px Arial";
      ctx.fillText("💫", width * 0.1, height * 0.3);
      ctx.font = "18px Arial";
      ctx.fillText("🌟", width * 0.9, height * 0.5);
      ctx.font = "30px Arial";
      ctx.fillText("🌌", width * 0.92, height * 0.08);
      break;
    case "beach":
      // 绘制海滩装饰
      ctx.font = "24px Arial";
      ctx.fillText("🐚", width * 0.15, height * 0.1);
      ctx.font = "20px Arial";
      ctx.fillText("🦀", width * 0.8, height * 0.25);
      ctx.font = "22px Arial";
      ctx.fillText("⛱️", width * 0.1, height * 0.3);
      ctx.font = "18px Arial";
      ctx.fillText("🐠", width * 0.9, height * 0.5);
      ctx.font = "28px Arial";
      ctx.fillText("☀️", width * 0.9, height * 0.05);
      break;
    case "forest":
      // 绘制森林装饰
      ctx.font = "28px Arial";
      ctx.fillText("🌲", width * 0.15, height * 0.1);
      ctx.font = "24px Arial";
      ctx.fillText("🌳", width * 0.8, height * 0.25);
      ctx.font = "20px Arial";
      ctx.fillText("🍄", width * 0.1, height * 0.3);
      ctx.font = "18px Arial";
      ctx.fillText("🦊", width * 0.9, height * 0.5);
      ctx.font = "22px Arial";
      ctx.fillText("🦉", width * 0.92, height * 0.08);
      break;
    case "cherry":
      // 绘制樱花装饰
      ctx.font = "22px Arial";
      ctx.fillText("🌸", width * 0.15, height * 0.1);
      ctx.font = "18px Arial";
      ctx.fillText("🌸", width * 0.8, height * 0.25);
      ctx.font = "20px Arial";
      ctx.fillText("🌸", width * 0.1, height * 0.3);
      ctx.font = "16px Arial";
      ctx.fillText("🎀", width * 0.9, height * 0.5);
      ctx.font = "24px Arial";
      ctx.fillText("💮", width * 0.92, height * 0.05);
      break;
  }
}
