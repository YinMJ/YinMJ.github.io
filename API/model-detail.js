// 临时端点映射（后台管理系统完成后，将从API数据中读取）
const TEMP_ENDPOINT_MAP = {
  'Nano Banana': [
    { name: 'Image Editing', value: 'image-editing' },
    { name: 'Text to Image', value: 'text-to-image' }
  ],
  'Veo 3.1': [
    { name: 'Text to Video', value: 'text-to-video' },
    { name: 'Text to Video (Fast)', value: 'text-to-video-fast' },
    { name: 'First/Last Frame to Video (Fast)', value: 'first-last-frame-to-video-fast' },
    { name: 'Image to Video (Fast)', value: 'image-to-video-fast' },
    { name: 'First/Last Frame to Video', value: 'first-last-frame-to-video' },
    { name: 'Image to Video', value: 'image-to-video' },
    { name: 'Reference to Video', value: 'reference-to-video' }
  ]
};

// 获取模型的端点列表
function getModelEndpoints(api) {
  // 优先使用API数据中的detail.endpoints字段（后台配置的端点）
  if (api?.detail?.endpoints && Array.isArray(api.detail.endpoints) && api.detail.endpoints.length > 0) {
    return api.detail.endpoints;
  }
  
  // 其次使用API数据中的endpoints字段（兼容旧数据）
  if (api?.endpoints && Array.isArray(api.endpoints) && api.endpoints.length > 0) {
    return api.endpoints;
  }
  
  // 临时方案：根据模型名称从映射中获取
  if (api?.name && TEMP_ENDPOINT_MAP[api.name]) {
    return TEMP_ENDPOINT_MAP[api.name];
  }
  
  // 默认返回空数组（不显示端点下拉菜单）
  return [];
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const apiId = params.get('id');
  const endpointParam = params.get('endpoint'); // 获取URL中的端点参数
  
  // 确保数据已加载
  function ensureDataLoaded() {
    // 如果数据还没加载，尝试主动加载
    if (!window._allApisData || window._allApisData.length === 0) {
      if (typeof loadDynamicData === 'function') {
        loadDynamicData();
        return false; // 数据正在加载
      }
    }
    return true; // 数据已加载
  }
  
  // 等待数据加载完成
  function tryLoadModel() {
    let api = null;
    
    // 确保数据已加载
    if (!ensureDataLoaded()) {
      setTimeout(tryLoadModel, 100);
      return;
    }
    
    if (apiId) {
      // 优先尝试从全局数据中查找（这是最可靠的数据源）
      if (window._allApisData && Array.isArray(window._allApisData)) {
        api = window._allApisData.find(item => item.id === Number(apiId));
      }
      
      // 如果还没找到，尝试使用 getApiById（从 localStorage 获取）
      if (!api && typeof getApiById === 'function') {
        api = getApiById(Number(apiId));
      }
      
      // 如果还没找到，尝试直接从 localStorage 读取
      if (!api) {
        try {
          const savedApis = localStorage.getItem('runninghub_apis');
          if (savedApis) {
            const apis = JSON.parse(savedApis);
            api = apis.find(a => a.id === Number(apiId));
          }
        } catch (error) {
          console.error('读取localStorage数据失败:', error);
        }
      }
    }
    
    // 如果找到了API，初始化页面
    if (api) {
      hydrateHeader(api, endpointParam);
      wireTabs();
      wireCopyButton();
      wireEndpointDropdown(api, endpointParam);
      wireComparisonModal();
      renderDynamicPlayground(api);
      renderDynamicApiDocs(api);
    } else if (apiId) {
      // 如果还没找到，再等待一下（可能是数据还在加载）
      setTimeout(tryLoadModel, 200);
    } else {
      // 没有API ID，显示未找到
      hydrateHeader(null);
      wireTabs();
      wireCopyButton();
      wireComparisonModal();
    }
  }
  
  // 开始尝试加载
  tryLoadModel();
});

function hydrateHeader(api, currentEndpoint = null){
  if(!api){
    const titleEl = document.getElementById('modelTitle');
    if (titleEl) titleEl.textContent = '未找到模型';
    return;
  }

  // 更新标题（如果有端点，显示"模型名/端点名"格式）
  const titleEl = document.getElementById('modelTitle');
  if (titleEl) {
    const endpoints = getModelEndpoints(api);
    
    // 确定要显示的端点
    let displayEndpoint = null;
    if (currentEndpoint) {
      displayEndpoint = endpoints.find(ep => ep.value === currentEndpoint);
    } else if (endpoints.length > 0) {
      // 没有URL参数，使用默认端点
      let defaultIndex = 0;
      // 优先使用detail.defaultEndpointIndex（后台配置的默认端点）
      if (api?.detail?.defaultEndpointIndex !== undefined && api.detail.defaultEndpointIndex < endpoints.length) {
        defaultIndex = api.detail.defaultEndpointIndex;
      } else if (api?.defaultEndpointIndex !== undefined && api.defaultEndpointIndex < endpoints.length) {
        defaultIndex = api.defaultEndpointIndex;
      }
      displayEndpoint = endpoints[defaultIndex];
    }
    
    // 更新标题（所有标题前面加上 RunningHub-ai/ 前缀）
    if (displayEndpoint) {
      titleEl.textContent = `RunningHub-ai/${api.name}/${displayEndpoint.name}`;
    } else {
      titleEl.textContent = `RunningHub-ai/${api.name}`;
    }
  }

  // 更新描述
  const descEl = document.getElementById('modelDescription');
  if (descEl) descEl.textContent = api.description || '';

  // 更新模型特点优势介绍
  const featuresEl = document.getElementById('modelFeatures');
  if (featuresEl) {
    // 支持多种字段名：features, advantages, highlights, 特点, 优势
    const featuresText = api.features || 
                        api.advantages || 
                        api.highlights || 
                        api.特点 || 
                        api.优势 || 
                        '该模型的特点和优势.....';
    featuresEl.textContent = featuresText;
  }

  // 更新标签（根据modelType判断）
  const tagEl = document.getElementById('modelTag');
  if (tagEl) {
    const isThirdParty = api.modelType === 'thirdParty';
    tagEl.textContent = isThirdParty ? '三方模型API' : '自有模型API';
  }

  // 更新统计数据
  const runCountEl = document.getElementById('runCountDisplay');
  if (runCountEl) runCountEl.textContent = formatNumber(api.runCount || 0);
  
  const likeCountEl = document.getElementById('likeCountDisplay');
  if (likeCountEl) likeCountEl.textContent = formatNumber(api.likeCount || 0);
  
  const favoriteCountEl = document.getElementById('favoriteCountDisplay');
  if (favoriteCountEl) favoriteCountEl.textContent = formatNumber(api.favoriteCount || 0);

  // 显示对应的表格
  const thirdPartyTable = document.getElementById('thirdPartyTable');
  const ownModelTable = document.getElementById('ownModelTable');
  const isThirdParty = api.modelType === 'thirdParty';
  
  if (thirdPartyTable) thirdPartyTable.style.display = isThirdParty ? 'table' : 'none';
  if (ownModelTable) ownModelTable.style.display = isThirdParty ? 'none' : 'table';

  // 更新表格中的价格
  updateTablePrices(api);
  
  // 根据模型类型更新弹窗表格内容
  if (isThirdParty) {
    updateModalTableForThirdParty(api);
  } else {
    updateModalTableForOwnModel(api);
  }
  
  const aboutText = document.getElementById('aboutText');
  if (aboutText) aboutText.textContent = api.description || '';
  const codeSample = document.getElementById('codeSample');
  if (codeSample) codeSample.textContent = sampleCode(api);
  
  // 渲染价格区
  renderPricingSection(api);
}

// 更新表格中的价格
function updateTablePrices(api) {
  const pricing = api.pricing;
  if (!pricing) return;

  // 默认使用国内价格（￥），如果国内价格不可用则使用国际价格作为备用
  const region = pricing.domestic;
  const fallback = pricing.international;
  const pick = (region && region.tiers && region.tiers.length > 0) ? region : fallback;
  
  if (!pick || !pick.tiers || pick.tiers.length === 0) return;
  
  // 默认使用人民币符号￥，如果使用的是国际价格（fallback）则使用美元符号$
  const sym = (pick === pricing.international) ? '$' : '¥';
  const firstTierPrice = pick.tiers[0].price;
  const priceText = `${sym}${firstTierPrice}/次`;

  // 更新三方模型API表格价格
  const thirdPartyPrice1 = document.getElementById('thirdPartyPrice1');
  const thirdPartyPrice2 = document.getElementById('thirdPartyPrice2');
  const thirdPartyPrice3 = document.getElementById('thirdPartyPrice3');
  if (thirdPartyPrice1) thirdPartyPrice1.textContent = priceText;
  if (thirdPartyPrice2) thirdPartyPrice2.textContent = priceText;
  if (thirdPartyPrice3) thirdPartyPrice3.textContent = priceText;

  // 更新自有模型API表格价格
  const ownModelPrice1 = document.getElementById('ownModelPrice1');
  const ownModelPrice2 = document.getElementById('ownModelPrice2');
  const ownModelPrice3 = document.getElementById('ownModelPrice3');
  if (ownModelPrice1) ownModelPrice1.textContent = priceText;
  if (ownModelPrice2) ownModelPrice2.textContent = priceText;
  if (ownModelPrice3) ownModelPrice3.textContent = priceText;
}

// 更新三方模型API的弹窗表格内容
function updateModalTableForThirdParty(api) {
  const tbody = document.getElementById('modalComparisonTableBody');
  if (!tbody) return;
  
  // 获取价格信息（与右侧表格一致）
  const pricing = api.pricing;
  let priceText = '¥XX/次';
  if (pricing) {
    const region = pricing.domestic;
    const fallback = pricing.international;
    const pick = (region && region.tiers && region.tiers.length > 0) ? region : fallback;
    
    if (pick && pick.tiers && pick.tiers.length > 0) {
      const sym = (pick === pricing.international) ? '$' : '¥';
      const firstTierPrice = pick.tiers[0].price;
      priceText = `${sym}${firstTierPrice}/次`;
    }
  }
  
  // 计费模式：消耗钱包余额（与右侧表格一致）
  const billingMode = '消耗钱包余额';
  
  // API并发数：默认50，如需扩大并发数请联系：jason@runninghub.ai（与右侧表格一致）
  const concurrency = '默认50，如需扩大并发数请联系：jason@runninghub.ai';
  
  // 动态生成三方模型API的弹窗表格内容
  tbody.innerHTML = `
    <tr>
      <td><strong>适用场景</strong></td>
      <td>个人或团队内部使用</td>
      <td>商业场景灵活调用，按需使用</td>
      <td>高并发生产、性能敏感场景</td>
    </tr>
    <tr>
      <td><strong>充值模式</strong></td>
      <td>会员套餐、钱包预充值</td>
      <td>钱包预充值</td>
      <td>独占套餐、钱包预充值</td>
    </tr>
    <tr>
      <td><strong>价格</strong></td>
      <td>${priceText}</td>
      <td>${priceText}</td>
      <td>${priceText}</td>
    </tr>
    <tr>
      <td><strong>计费模式</strong></td>
      <td>${billingMode}</td>
      <td>${billingMode}</td>
      <td>${billingMode}</td>
    </tr>
    <tr>
      <td><strong>API并发数</strong></td>
      <td>${concurrency}</td>
      <td>${concurrency}</td>
      <td>${concurrency}</td>
    </tr>
    <tr>
      <td><strong>主要优势</strong></td>
      <td>个人使用高性价比</td>
      <td>弹性灵活高并发商业场景</td>
      <td>独占算力，累积缓存，运行速度快且稳定</td>
    </tr>
    <tr>
      <td><strong>页面任务权益</strong></td>
      <td>同会员权益</td>
      <td>无</td>
      <td>见独占套餐产品说明</td>
    </tr>
    <tr>
      <td><strong>并存关系</strong></td>
      <td>可同时开通共享 API</td>
      <td>可同时开通会员或独占 API</td>
      <td>可同时开通共享 API</td>
    </tr>
    <tr>
      <td><strong>缓存说明</strong></td>
      <td colspan="3">
        <div style="line-height: 1.8;">
          当存在缓存时，任务运行时间将明显缩短。<br><br>
          共享资源池：任务在资源池中调度，若被调度至不同机器，则可能出现无缓存运行，导致运行时间增加。<br><br>
          独占资源池：若持续运行同一工作流，将保持缓存状态，一旦切换工作流，缓存会被清理。若希望始终保持缓存运行，目前可通过使用多个账号分别绑定独立工作流来实现。
        </div>
      </td>
    </tr>
  `;
}

// 更新自有模型API的弹窗表格内容
function updateModalTableForOwnModel(api) {
  const tbody = document.getElementById('modalComparisonTableBody');
  if (!tbody) return;
  
  // 获取价格信息（与右侧表格一致）
  const pricing = api.pricing;
  let priceText = '¥XX/次(次、张、秒等)';
  if (pricing) {
    const region = pricing.domestic;
    const fallback = pricing.international;
    const pick = (region && region.tiers && region.tiers.length > 0) ? region : fallback;
    
    if (pick && pick.tiers && pick.tiers.length > 0) {
      const sym = (pick === pricing.international) ? '$' : '¥';
      const firstTierPrice = pick.tiers[0].price;
      // 根据图片，价格格式为"¥XX/次(次、张、秒等)"
      priceText = `${sym}${firstTierPrice}/次(次、张、秒等)`;
    }
  }
  
  // 根据图片内容更新表格
  tbody.innerHTML = `
    <tr>
      <td><strong>适用场景</strong></td>
      <td>个人或团队内部使用</td>
      <td>商业化场景灵活调用, 按需使用</td>
      <td>高并发生产、性能敏感场景</td>
    </tr>
    <tr>
      <td><strong>GPU资源池</strong></td>
      <td>共享资源池</td>
      <td>共享资源池</td>
      <td>独占资源池</td>
    </tr>
    <tr>
      <td><strong>GPU类型</strong></td>
      <td>90系列24G/48G</td>
      <td>90系列24G/48G</td>
      <td>90系列24G/48G</td>
    </tr>
    <tr>
      <td><strong>充值模式</strong></td>
      <td>会员套餐、钱包预充值</td>
      <td>钱包预充值</td>
      <td>独占套餐、钱包预充值</td>
    </tr>
    <tr>
      <td><strong>价格</strong></td>
      <td>${priceText}</td>
      <td>${priceText}</td>
      <td>${priceText}</td>
    </tr>
    <tr>
      <td><strong>计费模式</strong></td>
      <td>消耗RH币</td>
      <td>消耗钱包余额</td>
      <td>租期内免费</td>
    </tr>
    <tr>
      <td><strong>API并发数</strong></td>
      <td>基础版会员:1; 基础版Plus会员:1; 专业版会员:3; 专业版Plus会员:5</td>
      <td>默认50, 如需扩大并发数请联系: jason@runninghub.ai</td>
      <td>任务的并发数等同于购买GPU数量</td>
    </tr>
    <tr>
      <td><strong>高速队列</strong></td>
      <td>会员高速队列</td>
      <td>企业级高速队列</td>
      <td>企业级高速队列</td>
    </tr>
    <tr>
      <td><strong>主要优势</strong></td>
      <td>个人使用性价比高</td>
      <td>弹性灵活的高并发商业化场景</td>
      <td>独享算力, 积累缓存, 运行速度快速稳定</td>
    </tr>
    <tr>
      <td><strong>页面任务权益</strong></td>
      <td>同会员权益</td>
      <td>无</td>
      <td>见独占套餐产品说明</td>
    </tr>
    <tr>
      <td><strong>并存关系</strong></td>
      <td>可同时开通共享 API</td>
      <td>可同时开通会员或独占 API</td>
      <td>可同时开通共享 API</td>
    </tr>
    <tr>
      <td><strong>缓存说明</strong></td>
      <td></td>
      <td>当存在缓存时, 任务运行时间将明显缩短。共享资源池:任务在资源池中调度, 若被调度至不同机器, 则可能出现无缓存运行, 导致运行时间增加。</td>
      <td>独占资源池:若持续运行同一工作流, 将保持缓存状态, 一旦切换工作流, 缓存会被清理。若希望始终保持缓存运行, 目前可通过使用多个账号分别绑定独立工作流来实现。</td>
    </tr>
  `;
}

// 复制模型名称
function wireCopyButton() {
  const copyBtn = document.getElementById('copyModelNameBtn');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', () => {
    const titleEl = document.getElementById('modelTitle');
    if (!titleEl) return;

    const modelName = titleEl.textContent;
    navigator.clipboard.writeText(modelName).then(() => {
      // 显示复制成功提示
      const originalIcon = copyBtn.querySelector('i');
      if (originalIcon) {
        const originalClass = originalIcon.className;
        originalIcon.className = 'fas fa-check';
        setTimeout(() => {
          originalIcon.className = originalClass;
        }, 2000);
      }
    }).catch(err => {
      console.error('复制失败:', err);
    });
  });
}

// 端点下拉菜单
function wireEndpointDropdown(api, currentEndpointParam = null) {
  const dropdownBtn = document.getElementById('endpointDropdownBtn');
  const dropdownMenu = document.getElementById('endpointDropdownMenu');
  const currentEndpoint = document.getElementById('currentEndpoint');
  const wrapper = document.querySelector('.model-endpoint-dropdown-wrapper');
  
  if (!dropdownBtn || !dropdownMenu || !currentEndpoint) return;

  // 获取端点列表
  const endpoints = getModelEndpoints(api);
  
  // 获取提示信息图标
  const infoIconWrapper = document.querySelector('.info-icon-wrapper');
  
  // 如果没有端点，隐藏下拉菜单和提示信息图标
  if (!endpoints || endpoints.length === 0) {
    if (wrapper) wrapper.style.display = 'none';
    if (infoIconWrapper) infoIconWrapper.style.display = 'none';
    return;
  }
  
  // 确保下拉菜单和提示信息图标可见
  if (wrapper) wrapper.style.display = '';
  if (infoIconWrapper) infoIconWrapper.style.display = '';
  
  // 确定当前选中的端点
  let selectedIndex = 0;
  let selectedEndpoint = endpoints[0];
  
  if (currentEndpointParam) {
    // 从URL参数中获取端点
    const foundIndex = endpoints.findIndex(ep => ep.value === currentEndpointParam);
    if (foundIndex !== -1) {
      selectedIndex = foundIndex;
      selectedEndpoint = endpoints[foundIndex];
    }
  } else {
    // 没有URL参数，使用默认端点
    // 优先使用detail.defaultEndpointIndex（后台配置的默认端点）
    if (api?.detail?.defaultEndpointIndex !== undefined && api.detail.defaultEndpointIndex < endpoints.length) {
      selectedIndex = api.detail.defaultEndpointIndex;
      selectedEndpoint = endpoints[selectedIndex];
    } else if (api?.defaultEndpointIndex !== undefined && api.defaultEndpointIndex < endpoints.length) {
      // 使用API数据中的默认端点索引（兼容旧数据）
      selectedIndex = api.defaultEndpointIndex;
      selectedEndpoint = endpoints[selectedIndex];
    } else {
      // 默认选中第一个端点
      selectedIndex = 0;
      selectedEndpoint = endpoints[0];
    }
    
    // 如果没有URL参数但有端点，自动添加默认端点到URL（但不刷新页面）
    // 这样可以让URL保持与显示一致
    const params = new URLSearchParams(window.location.search);
    if (!params.has('endpoint')) {
      params.set('endpoint', selectedEndpoint.value);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }

  // 初始化显示选中的端点
  if (currentEndpoint) {
    currentEndpoint.textContent = selectedEndpoint.name;
  }

  // 清空现有菜单项
  dropdownMenu.innerHTML = '';

  // 生成下拉菜单项
  endpoints.forEach((endpoint, index) => {
    const item = document.createElement('div');
    item.className = 'endpoint-menu-item';
    item.textContent = endpoint.name;
    item.dataset.index = index;
    item.dataset.value = endpoint.value;
    
    // 如果是当前选中的项，添加选中标记
    if (index === selectedIndex) {
      item.classList.add('selected');
      const checkmark = document.createElement('i');
      checkmark.className = 'fas fa-check';
      checkmark.style.marginLeft = 'auto';
      checkmark.style.color = '#af52de'; // 紫色对勾
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.justifyContent = 'space-between';
      item.appendChild(checkmark);
    }
    
    dropdownMenu.appendChild(item);
  });

  // 点击下拉按钮
  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.toggle('active');
  });

  // 点击菜单项
  dropdownMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.endpoint-menu-item');
    if (!item) return;
    
    const index = parseInt(item.dataset.index);
    const endpointValue = item.dataset.value;
    
    if (endpoints[index] && currentEndpoint) {
      // 获取当前URL参数
      const params = new URLSearchParams(window.location.search);
      const apiId = params.get('id');
      
      // 更新URL，添加端点参数
      params.set('endpoint', endpointValue);
      
      // 刷新页面到新的端点
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.location.href = newUrl;
    }
  });
  
  // 点击外部区域关闭下拉菜单
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove('active');
    }
  });
}

// 弹窗逻辑
function wireComparisonModal() {
  const modal = document.getElementById('comparisonModal');
  const comparisonBtn = document.getElementById('comparisonLinkBtn');
  const closeBtn = modal?.querySelector('.modal-close');

  if (!modal || !comparisonBtn) return;

  // 打开弹窗
  comparisonBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  });

  // 关闭弹窗
  function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });
}

function wireTabs(){
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      // 更新所有tab按钮状态
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // 更新对应的pane显示
      const target = document.querySelector(btn.dataset.target);
      document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
      if (target) target.classList.add('active');
    });
  });
}

function wirePlayground(){
  const runBtn = document.getElementById('runBtn');
  const resetBtn = document.getElementById('resetBtn');
  const promptInput = document.getElementById('promptInput');
  const logBox = document.getElementById('logBox');
  const preview = document.getElementById('previewBox');
  const firstInput = document.getElementById('firstInput');
  const lastInput = document.getElementById('lastInput');
  const firstUrl = document.getElementById('firstUrl');
  const lastUrl = document.getElementById('lastUrl');
  const resolution = document.getElementById('resolutionSelect');
  const ratio = document.getElementById('ratioSelect');
  const duration = document.getElementById('durationSelect');
  const audioToggle = document.getElementById('audioToggle');

  const setPreview = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      preview.style.backgroundImage = `url(${reader.result})`;
      preview.style.backgroundSize = 'cover';
      preview.style.backgroundPosition = 'center';
    };
    reader.readAsDataURL(file);
  };

  firstInput?.addEventListener('change', (e) => setPreview(e.target.files?.[0]));
  lastInput?.addEventListener('change', (e) => setPreview(e.target.files?.[0]));

  runBtn?.addEventListener('click', () => {
    const payload = {
      first_frame_url: firstUrl.value || '(uploaded file)',
      last_frame_url:  lastUrl.value  || '(uploaded file)',
      prompt:          promptInput.value,
      duration:        duration.value,
      aspect_ratio:    ratio.value,
      resolution:      resolution.value,
      generate_audio:  !!audioToggle.checked
    };
    appendLog(logBox, '提交任务...');
    appendLog(logBox, '输入参数: ' + JSON.stringify(payload));
    setTimeout(() => appendLog(logBox, '队列中...'), 600);
    setTimeout(() => appendLog(logBox, '处理中...'), 1400);
    setTimeout(() => appendLog(logBox, '完成（示例）'), 2400);
  });
  resetBtn?.addEventListener('click', () => {
    promptInput.value = '';
    preview.style.backgroundImage = '';
    firstUrl.value = '';
    lastUrl.value = '';
  });
}

function appendLog(el, line){
  if (!el) return;
  el.textContent += `\n${new Date().toLocaleTimeString()}  ${line}`;
}

function formatNumber(n){
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  if (n >= 1_000) return (n/1_000).toFixed(1)+'K';
  return String(n);
}

function firstTierBrief(pricing){
  if (!pricing) return '价格待定';
  const isDomestic = window.location.hostname.includes('.ai'); // 约定：ai=国内, cn=国外
  const region = isDomestic ? pricing.domestic : pricing.international;
  const fallback = isDomestic ? pricing.international : pricing.domestic;
  const pick = (region && region.tiers && region.tiers[0]) ? region : fallback;
  if (!pick || !pick.tiers || !pick.tiers[0]) return '价格待定';
  const sym = (pick === pricing.international) ? '$' : '¥';
  return `${pick.tiers[0].name} ${sym}${pick.tiers[0].price}/${pick.unit}`;
}

function sampleCode(api){
  const id = api?.id ?? 'MODEL_ID';
  return `pip install rh-client\n\nfrom rh import Client\nclient = Client(api_key="YOUR_API_KEY")\nresult = client.generate(model=${JSON.stringify(id)}, prompt="一段描述")\nprint(result)`;
}

// ----- 动态渲染（基于admin配置） -----
function renderDynamicPlayground(api){
  if (!api || !api.detail || !api.detail.playground) return; // 使用静态模板回退
  const pane = document.getElementById('playgroundPane');
  if (!pane) return;
  // 重绘左侧输入区域核心表单
  const left = pane.querySelector('.panel.left');
  const actions = left.querySelector('.actions');
  const beforeActions = left.querySelectorAll('.form-block, .form-row');
  beforeActions.forEach(n => n.remove());

  const inputs = api.detail.playground.inputs || [];
  inputs.forEach(inp => {
    const wrap = document.createElement('div');
    wrap.className = 'form-block';
    const label = document.createElement('label');
    label.textContent = inp.label || inp.key;
    label.className = 'req';
    wrap.appendChild(label);
    let field;
    switch(inp.type){
      case 'file':
        field = document.createElement('div');
        field.className = 'uploader';
        field.innerHTML = `<div class="uploader-inner">+<span>上传文件</span></div><input type="file" data-key="${inp.key}">`;
        break;
      case 'url':
        field = document.createElement('input');
        field.type = 'url';
        field.placeholder = inp.placeholder || '输入URL';
        field.setAttribute('data-key', inp.key);
        field.className = 'url-input';
        break;
      case 'textarea':
        field = document.createElement('textarea');
        field.rows = 5;
        field.placeholder = inp.placeholder || '';
        field.setAttribute('data-key', inp.key);
        break;
      case 'select':
        field = document.createElement('select');
        (inp.options||[]).forEach(opt=>{ const o=document.createElement('option'); o.textContent=opt; o.value=opt; field.appendChild(o); });
        field.setAttribute('data-key', inp.key);
        break;
      case 'toggle':
        field = document.createElement('input');
        field.type = 'checkbox';
        field.checked = !!inp.default;
        field.setAttribute('data-key', inp.key);
        break;
    }
    if (field) wrap.appendChild(field);
    actions.parentNode.insertBefore(wrap, actions);
  });

  // 运行逻辑收集动态值
  const runBtn = pane.querySelector('#runBtn');
  const logBox = pane.querySelector('#logBox');
  const preview = pane.querySelector('#previewBox');
  runBtn.onclick = () => {
    const values = {};
    pane.querySelectorAll('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key');
      let v = '';
      if (el.type === 'file') v = el.files && el.files[0] ? '(file)' : '';
      else if (el.type === 'checkbox') v = el.checked;
      else v = el.value;
      values[key] = v;
    });
    appendLog(logBox, '提交任务...');
    appendLog(logBox, '输入参数: ' + JSON.stringify(values));
    setTimeout(()=>appendLog(logBox,'处理完成（示例）'), 1500);
    // 结果区域示例显示
    const t = api.detail.playground.result?.type || 'video';
    if (t === 'image') { preview.style.backgroundImage=''; preview.innerHTML='<img style="max-width:100%">'; }
    if (t === 'video') { preview.style.backgroundImage=''; preview.innerHTML='<video controls style="width:100%"><source></video>'; }
    if (t === 'json') { preview.style.backgroundImage=''; preview.innerHTML='<pre style="padding:12px;color:#9aa7b8">{"ok":true}</pre>'; }
  };
}

function renderDynamicApiDocs(api){
  if (!api || !api.detail || !api.detail.api) return;
  const about = document.getElementById('aboutText');
  const code = document.getElementById('codeSample');
  if (about) about.textContent = api.detail.api.about || about.textContent;
  if (code && api.detail.api.quickSample) code.textContent = api.detail.api.quickSample;
}

/**
 * 渲染价格区
 */
function renderPricingSection(api) {
  const pricingSection = document.getElementById('pricingSection');
  const pricingContent = document.getElementById('pricingContent');
  
  if (!pricingSection || !pricingContent) return;
  
  const pricing = api.pricing;
  if (!pricing) {
    pricingSection.style.display = 'none';
    return;
  }
  
  // 优先使用国内价格，如果没有则使用国际价格
  const priceData = pricing.domestic || pricing.international;
  if (!priceData) {
    pricingSection.style.display = 'none';
    return;
  }
  
  // 显示价格区
  pricingSection.style.display = 'block';
  
  // 根据价格类型渲染不同的价格表
  const priceType = priceData.type;
  let html = '';
  
  if (priceType === 'simple') {
    html = renderSimplePricing(priceData);
  } else if (priceType === 'per-call') {
    html = renderPerCallPricing(priceData);
  } else if (priceType === 'per-second') {
    html = renderPerSecondPricing(priceData);
  } else if (priceType === 'single-dimension') {
    html = renderSingleDimensionPricing(priceData);
  } else if (priceType === 'multi-dimension') {
    html = renderMultiDimensionPricing(priceData);
  } else {
    // 兼容旧格式：tiers
    html = renderTiersPricing(priceData);
  }
  
  pricingContent.innerHTML = html;
}

/**
 * 渲染简单价格
 */
function renderSimplePricing(priceData) {
  const priceMode = priceData.priceMode || 'fixed';
  const price = priceData.price || 0;
  const unit = priceData.unit || '次';
  const unitMultiplier = priceData.unitMultiplier || 1;
  
  let displayUnit = unit;
  if (unitMultiplier > 1) {
    displayUnit = `${unitMultiplier}${unit}`;
  }
  
  if (priceMode === 'fixed') {
    return `
      <div class="pricing-table">
        <table>
          <thead>
            <tr>
              <th>计费方式</th>
              <th>价格</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>固定价格</td>
              <td>￥${price.toFixed(2)}/次</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  } else {
    return `
      <div class="pricing-table">
        <table>
          <thead>
            <tr>
              <th>计费方式</th>
              <th>单价</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>单价模式</td>
              <td>￥${price.toFixed(2)}/${displayUnit}</td>
              <td>总价 = 单价 × 数量</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
}

/**
 * 渲染按次计费（兼容旧格式）
 */
function renderPerCallPricing(priceData) {
  const price = priceData.perCallPrice || 0;
  return `
    <div class="pricing-table">
      <table>
        <thead>
          <tr>
            <th>计费方式</th>
            <th>价格</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>按次计费</td>
            <td>￥${price.toFixed(2)}/次</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * 渲染按时长计费（兼容旧格式）
 */
function renderPerSecondPricing(priceData) {
  const price = priceData.perSecondPrice || 0;
  return `
    <div class="pricing-table">
      <table>
        <thead>
          <tr>
            <th>计费方式</th>
            <th>价格</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>按时长计费</td>
            <td>￥${price.toFixed(2)}/秒</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * 渲染单维度价格表
 */
function renderSingleDimensionPricing(priceData) {
  const dimensionName = priceData.dimensionName || '参数';
  const dimensions = priceData.dimensions || [];
  
  if (dimensions.length === 0 || !dimensions[0] || !dimensions[0].values || dimensions[0].values.length === 0) {
    return '<div class="pricing-empty">暂无价格配置</div>';
  }
  
  const values = dimensions[0].values;
  
  let tableRows = '';
  values.forEach((item, index) => {
    const value = item.value || '';
    const price = item.price || 0;
    const priceMode = item.priceMode || 'fixed';
    const unit = item.unit || '次';
    const unitMultiplier = item.unitMultiplier || 1;
    
    let displayUnit = unit;
    if (unitMultiplier > 1) {
      displayUnit = `${unitMultiplier}${unit}`;
    }
    
    let priceDisplay = '';
    if (priceMode === 'fixed') {
      priceDisplay = `￥${price.toFixed(2)}/次`;
    } else {
      priceDisplay = `￥${price.toFixed(2)}/${displayUnit}`;
    }
    
    tableRows += `
      <tr>
        <td>${escapeHtml(value)}</td>
        <td>${priceDisplay}</td>
      </tr>
    `;
  });
  
  return `
    <div class="pricing-table">
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(dimensionName)}</th>
            <th>价格</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * 渲染多维度价格表
 */
function renderMultiDimensionPricing(priceData) {
  const dimensions = priceData.dimensions || [];
  const dimensionMatrix = priceData.dimensionMatrix || [];
  
  if (dimensions.length === 0 || dimensionMatrix.length === 0) {
    return '<div class="pricing-empty">暂无价格配置</div>';
  }
  
  // 生成价格矩阵表格
  let tableRows = '';
  dimensionMatrix.forEach((item, index) => {
    const params = item.params || {};
    const price = item.price || 0;
    const priceMode = item.priceMode || 'fixed';
    const unit = item.unit || '次';
    const unitMultiplier = item.unitMultiplier || 1;
    
    let displayUnit = unit;
    if (unitMultiplier > 1) {
      displayUnit = `${unitMultiplier}${unit}`;
    }
    
    let priceDisplay = '';
    if (priceMode === 'fixed') {
      priceDisplay = `￥${price.toFixed(2)}/次`;
    } else {
      priceDisplay = `￥${price.toFixed(2)}/${displayUnit}`;
    }
    
    // 生成参数显示（使用维度索引匹配）
    let paramCells = '';
    dimensions.forEach((dim, dimIndex) => {
      let displayValue = '';
      
      // 优先使用维度索引作为key
      if (params[dimIndex] !== undefined) {
        const paramValue = params[dimIndex];
        // 如果paramValue是数字索引，尝试从dim.values中获取实际值
        if (dim.values && !isNaN(parseInt(paramValue))) {
          const valIndex = parseInt(paramValue);
          if (dim.values[valIndex]) {
            displayValue = dim.values[valIndex];
          } else {
            displayValue = paramValue;
          }
        } else {
          // 如果paramValue是字符串值，直接使用
          displayValue = paramValue;
        }
      } else if (params[dim.name] !== undefined) {
        // 使用维度名称作为key
        const paramValue = params[dim.name];
        if (dim.values && !isNaN(parseInt(paramValue))) {
          const valIndex = parseInt(paramValue);
          if (dim.values[valIndex]) {
            displayValue = dim.values[valIndex];
          } else {
            displayValue = paramValue;
          }
        } else {
          displayValue = paramValue;
        }
      } else {
        // 尝试直接匹配值
        for (const [key, value] of Object.entries(params)) {
          if (dim.values && dim.values.includes(value)) {
            displayValue = value;
            break;
          }
        }
      }
      
      paramCells += `<td>${escapeHtml(displayValue)}</td>`;
    });
    
    tableRows += `
      <tr>
        ${paramCells}
        <td>${priceDisplay}</td>
      </tr>
    `;
  });
  
  // 生成表头
  let tableHeaders = '';
  dimensions.forEach(dim => {
    tableHeaders += `<th>${escapeHtml(dim.name || '')}</th>`;
  });
  tableHeaders += '<th>价格</th>';
  
  return `
    <div class="pricing-table">
      <table>
        <thead>
          <tr>
            ${tableHeaders}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * 渲染价格阶梯（兼容旧格式）
 */
function renderTiersPricing(priceData) {
  const tiers = priceData.tiers || [];
  const unit = priceData.unit || '次';
  
  if (tiers.length === 0) {
    return '<div class="pricing-empty">暂无价格配置</div>';
  }
  
  let tableRows = '';
  tiers.forEach((tier, index) => {
    const name = tier.name || `阶梯${index + 1}`;
    const price = tier.price || 0;
    tableRows += `
      <tr>
        <td>${escapeHtml(name)}</td>
        <td>￥${price.toFixed(2)}/${unit}</td>
      </tr>
    `;
  });
  
  return `
    <div class="pricing-table">
      <table>
        <thead>
          <tr>
            <th>阶梯</th>
            <th>价格</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * 绑定价格交互事件（单维度/多维度）
 */
function bindPricingInteractions(priceData) {
  const priceType = priceData.type;
  
  if (priceType === 'single-dimension') {
    bindSingleDimensionInteractions(priceData);
  } else if (priceType === 'multi-dimension') {
    bindMultiDimensionInteractions(priceData);
  }
}

/**
 * 绑定单维度交互事件
 */
function bindSingleDimensionInteractions(priceData) {
  const dimensionSelect = document.getElementById('dimensionSelect');
  const quantityInputWrapper = document.getElementById('quantityInputWrapper');
  const quantityInput = document.getElementById('quantityInput');
  const pricingResult = document.getElementById('pricingResult');
  const totalPriceSpan = document.getElementById('totalPrice');
  
  if (!dimensionSelect) return;
  
  function updatePrice() {
    const selectedIndex = dimensionSelect.value;
    if (!selectedIndex || selectedIndex === '') {
      quantityInputWrapper.style.display = 'none';
      pricingResult.style.display = 'none';
      return;
    }
    
    const option = dimensionSelect.options[dimensionSelect.selectedIndex];
    const price = parseFloat(option.dataset.price) || 0;
    const priceMode = option.dataset.priceMode || 'fixed';
    const unit = option.dataset.unit || '次';
    const unitMultiplier = parseFloat(option.dataset.unitMultiplier) || 1;
    
    if (priceMode === 'unit') {
      // 单价模式：显示数量输入框
      quantityInputWrapper.style.display = 'flex';
      const quantity = parseFloat(quantityInput.value) || 1;
      const totalPrice = price * quantity;
      totalPriceSpan.textContent = `￥${totalPrice.toFixed(2)}`;
      pricingResult.style.display = 'block';
    } else {
      // 固定价格模式
      quantityInputWrapper.style.display = 'none';
      totalPriceSpan.textContent = `￥${price.toFixed(2)}`;
      pricingResult.style.display = 'block';
    }
  }
  
  dimensionSelect.addEventListener('change', updatePrice);
  if (quantityInput) {
    quantityInput.addEventListener('input', updatePrice);
  }
}

/**
 * 绑定多维度交互事件
 */
function bindMultiDimensionInteractions(priceData) {
  const dimensions = priceData.dimensions || [];
  const dimensionMatrix = priceData.dimensionMatrix || [];
  const quantityInputWrapper = document.getElementById('quantityInputWrapper');
  const quantityInput = document.getElementById('quantityInput');
  const pricingResult = document.getElementById('pricingResult');
  const totalPriceSpan = document.getElementById('totalPrice');
  
  function updatePrice() {
    // 收集所有维度的选择值
    const selectedValues = {};
    let allSelected = true;
    
    dimensions.forEach((dim, dimIndex) => {
      const select = document.getElementById(`dimensionSelect${dimIndex}`);
      if (!select || !select.value || select.value === '') {
        allSelected = false;
      } else {
        const valIndex = parseInt(select.value);
        selectedValues[dim.name] = valIndex;
      }
    });
    
    if (!allSelected) {
      quantityInputWrapper.style.display = 'none';
      pricingResult.style.display = 'none';
      return;
    }
    
    // 在价格矩阵中查找匹配的行
    const matchedRow = dimensionMatrix.find(item => {
      const params = item.params || {};
      return Object.keys(selectedValues).every(key => {
        return params[key] === selectedValues[key].toString();
      });
    });
    
    if (!matchedRow) {
      quantityInputWrapper.style.display = 'none';
      pricingResult.style.display = 'none';
      return;
    }
    
    const price = matchedRow.price || 0;
    const priceMode = matchedRow.priceMode || 'fixed';
    
    if (priceMode === 'unit') {
      // 单价模式：显示数量输入框
      quantityInputWrapper.style.display = 'flex';
      const quantity = parseFloat(quantityInput.value) || 1;
      const totalPrice = price * quantity;
      totalPriceSpan.textContent = `￥${totalPrice.toFixed(2)}`;
      pricingResult.style.display = 'block';
    } else {
      // 固定价格模式
      quantityInputWrapper.style.display = 'none';
      totalPriceSpan.textContent = `￥${price.toFixed(2)}`;
      pricingResult.style.display = 'block';
    }
  }
  
  // 为每个维度选择器绑定事件
  dimensions.forEach((dim, dimIndex) => {
    const select = document.getElementById(`dimensionSelect${dimIndex}`);
    if (select) {
      select.addEventListener('change', updatePrice);
    }
  });
  
  if (quantityInput) {
    quantityInput.addEventListener('input', updatePrice);
  }
}

/**
 * HTML转义
 */
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

