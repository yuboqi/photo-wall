/**
 * 照片滤镜处理器
 * 提供多种滤镜效果应用于照片
 */

class FilterProcessor {
  /**
   * 应用指定滤镜到图片元素
   * @param {HTMLImageElement} image - 原始图片元素
   * @param {string} filterType - 滤镜类型
   * @returns {Promise<HTMLCanvasElement>} 应用滤镜后的canvas元素
   */
  static async applyFilter(image, filterType) {
    // 创建canvas用于处理图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置canvas尺寸与图片一致
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    
    // 绘制原始图片到canvas
    ctx.drawImage(image, 0, 0);
    
    // 根据滤镜类型应用不同的效果
    switch (filterType) {
      case 'vivid':
        return this.applyVividFilter(canvas, ctx);
      case 'film':
        return this.applyFilmFilter(canvas, ctx);
      case 'bw':
        return this.applyBlackWhiteFilter(canvas, ctx);
      case 'warm':
        return this.applyWarmFilter(canvas, ctx);
      case 'cool':
        return this.applyCoolFilter(canvas, ctx);
      default:
        // 默认返回原图
        return canvas;
    }
  }
  
  /**
   * 鲜艳滤镜 - 增强饱和度和对比度
   */
  static applyVividFilter(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // 增加RGB值以提高饱和度
      data[i] = Math.min(255, data[i] * 1.2);       // Red
      data[i + 1] = Math.min(255, data[i + 1] * 1.2); // Green
      data[i + 2] = Math.min(255, data[i + 2] * 1.2); // Blue
      
      // 略微增加对比度
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (avg > 128) {
        data[i] = Math.min(255, data[i] + 15);
        data[i + 1] = Math.min(255, data[i + 1] + 15);
        data[i + 2] = Math.min(255, data[i + 2] + 15);
      } else {
        data[i] = Math.max(0, data[i] - 15);
        data[i + 1] = Math.max(0, data[i + 1] - 15);
        data[i + 2] = Math.max(0, data[i + 2] - 15);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  /**
   * 胶片滤镜 - 模拟胶片质感
   */
  static applyFilmFilter(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // 添加轻微的颗粒感
      const noise = (Math.random() - 0.5) * 30;
      
      // 调整色调偏向暖色
      data[i] = Math.min(255, Math.max(0, data[i] + 10 + noise));     // Red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + 5 + noise)); // Green
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - 5 + noise)); // Blue
      
      // 降低一点饱和度营造复古感
      const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      data[i] = Math.min(255, 0.8 * data[i] + 0.2 * gray);
      data[i + 1] = Math.min(255, 0.8 * data[i + 1] + 0.2 * gray);
      data[i + 2] = Math.min(255, 0.8 * data[i + 2] + 0.2 * gray);
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  /**
   * 黑白滤镜
   */
  static applyBlackWhiteFilter(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // 计算灰度值
      const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      
      // 应用灰度值到所有颜色通道
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  /**
   * 暖色滤镜
   */
  static applyWarmFilter(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // 增加红色和绿色通道，减少蓝色通道
      data[i] = Math.min(255, data[i] * 1.15);       // Red
      data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Green
      data[i + 2] = Math.max(0, data[i + 2] * 0.9);   // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  /**
   * 冷色滤镜
   */
  static applyCoolFilter(canvas, ctx) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // 减少红色通道，增加蓝色和绿色通道
      data[i] = Math.max(0, data[i] * 0.9);          // Red
      data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Green
      data[i + 2] = Math.min(255, data[i + 2] * 1.15); // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  /**
   * 将canvas转换为图片URL
   * @param {HTMLCanvasElement} canvas - canvas元素
   * @returns {string} 图片DataURL
   */
  static canvasToImageURL(canvas) {
    return canvas.toDataURL('image/jpeg', 0.92);
  }
  
  /**
   * 将图片URL转换为图片元素
   * @param {string} imageURL - 图片URL
   * @returns {Promise<HTMLImageElement>} 图片元素
   */
  static async imageURLToImage(imageURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageURL;
    });
  }
}

// 导出滤镜处理器
window.FilterProcessor = FilterProcessor;