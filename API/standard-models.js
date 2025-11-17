// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 如果是模型详情页，只加载数据，不执行页面初始化
    if (window._isModelDetailPage) {
        // 只加载数据，不执行其他初始化逻辑
        loadDynamicData();
        return;
    }
    
    // 如果是 ComfyUI 工作流页面，只加载数据，不执行页面初始化
    if (window._isComfyUIWorkflowsPage) {
        // 只加载数据，不执行其他初始化逻辑（包括模型卡片交互）
        loadDynamicData();
        return;
    }
    
    initializePage();
});

function initializePage() {
    // 加载动态数据
    loadDynamicData();
    
    // 添加Hero区域交互
    addHeroInteractions();
    
    // 添加搜索功能
    addSearchFunctionality();
    
    // 添加筛选功能
    addFilterFunctionality();
    
    // 添加弹窗功能
    addModalFunctionality();
    
    // 添加模型卡片交互
    addModelCardInteractions();
    
    // 延迟初始化Hero交互，确保数据已加载
    setTimeout(() => {
        // 初始化时，确保默认选中的标签对应的Hero内容正确显示
        const activeTab = document.querySelector('.model-tab.active');
        if (activeTab && window._allApisData && window._allApisData.length > 0) {
            updateHeroContent(activeTab.dataset.model);
        } else if (activeTab) {
            // 如果还没有数据，确保至少设置了apiId（使用默认的Nano Banana）
            const heroSection = document.querySelector('.hero-section');
            if (heroSection && !heroSection.dataset.apiId) {
                // 查找Nano Banana的id
                const nanoBanana = window._allApisData?.find(api => api.name === 'Nano Banana');
                if (nanoBanana && nanoBanana.id) {
                    heroSection.dataset.apiId = nanoBanana.id;
                }
            }
        }
    }, 200);
}

// 加载动态数据
function loadDynamicData() {
    // 首先尝试从 localStorage 读取数据
    let apisFromStorage = [];
    try {
        const savedApis = localStorage.getItem('runninghub_apis');
        if (savedApis) {
            apisFromStorage = JSON.parse(savedApis);
        }
    } catch (error) {
        console.error('读取localStorage数据失败:', error);
    }
    
    // 直接使用硬编码的测试数据，确保有内容显示
    const testApis = [
        // 最近上新 - 10个卡片
        {
            id: 0,
            name: 'Nano Banana',
            description: 'Ultra-fast text-to-image generation with high quality and low latency.',
            modelType: 'own',
            functionCategory: '图像生成',
            categoryTitle: '最近上新',
            taskType: 'Text to Image',
            source: { type: 'official', channelName: '官方', channelId: 'official' },
            pricing: {
                domestic: { unit: '张', tiers: [{ name: '标准版', price: 0.05, description: '512x512' }] },
                international: { unit: '张', tiers: [{ name: '标准版', price: 0.008, description: '512x512' }] }
            },
            runCount: 3200000,
            status: 'active',
            freeTag: { enabled: true, count: 5 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 1,
            name: 'Flux Kontext',
            description: '基于Flux架构的高质量图像生成模型',
            modelType: 'own',
            functionCategory: '图像生成',
            categoryTitle: '最近上新',
            taskType: 'Text to Image',
            source: { type: 'official', channelName: '官方', channelId: 'official' },
            pricing: {
                domestic: { unit: '张', tiers: [{ name: '分辨率1', price: 0.05, description: '512x512' }] },
                international: { unit: '张', tiers: [{ name: '分辨率1', price: 0.008, description: '512x512' }] }
            },
            runCount: 1200000,
            status: 'active',
            freeTag: { enabled: true, count: 5 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 2,
            name: 'Stable Diffusion XL',
            description: '最先进的文本到图像生成模型',
            modelType: 'own',
            functionCategory: '图像生成',
            categoryTitle: '最近上新',
            taskType: 'Text to Image',
            source: { type: 'official', channelName: '官方', channelId: 'official' },
            pricing: {
                domestic: { unit: '张', tiers: [{ name: '分辨率1', price: 0.08, description: '512x512' }] },
                international: { unit: '张', tiers: [{ name: '分辨率1', price: 0.012, description: '512x512' }] }
            },
            runCount: 5800000,
            status: 'active',
            freeTag: { enabled: true, count: 5 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 3,
            name: 'DALL-E 3',
            description: 'OpenAI的最新图像生成模型',
            modelType: 'thirdParty',
            functionCategory: '图像生成',
            categoryTitle: '最近上新',
            taskType: 'Text to Image',
            source: { type: 'channel', channelName: 'OpenAI', channelId: 'openai' },
            pricing: {
                domestic: { unit: '张', tiers: [{ name: '标准版', price: 0.04, description: '1024x1024' }] },
                international: { unit: '张', tiers: [{ name: '标准版', price: 0.006, description: '1024x1024' }] }
            },
            runCount: 3200000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 4,
            name: 'Midjourney v6',
            description: '艺术级图像生成AI',
            modelType: 'thirdParty',
            functionCategory: '图像生成',
            categoryTitle: '最近上新',
            taskType: 'Text to Image',
            source: { type: 'channel', channelName: 'Midjourney', channelId: 'midjourney' },
            pricing: {
                domestic: { unit: '张', tiers: [{ name: '标准版', price: 0.12, description: '1024x1024' }] },
                international: { unit: '张', tiers: [{ name: '标准版', price: 0.02, description: '1024x1024' }] }
            },
            runCount: 8900000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 5,
            name: 'Kling Video',
            description: '高质量视频生成模型',
            modelType: 'own',
            functionCategory: '视频生成',
            categoryTitle: '最近上新',
            taskType: 'Text to Video',
            source: { type: 'official', channelName: '官方', channelId: 'official' },
            pricing: {
                domestic: { unit: '秒', tiers: [{ name: '标准版', price: 0.15, description: '1080p' }] },
                international: { unit: '秒', tiers: [{ name: '标准版', price: 0.025, description: '1080p' }] }
            },
            runCount: 2100000,
            status: 'active',
            freeTag: { enabled: true, count: 5 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 6,
            name: 'Sora 2',
            description: 'OpenAI的下一代视频生成模型',
            modelType: 'thirdParty',
            functionCategory: '视频生成',
            categoryTitle: 'Sora 2',
            taskType: 'Text to Video',
            source: { type: 'channel', channelName: 'OpenAI', channelId: 'openai' },
            pricing: {
                domestic: { unit: '秒', tiers: [{ name: '标准版', price: 0.25, description: '1080p' }] },
                international: { unit: '秒', tiers: [{ name: '标准版', price: 0.04, description: '1080p' }] }
            },
            runCount: 1500000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 7,
            name: 'Veo 3.1',
            description: 'Google的先进视频生成AI',
            modelType: 'thirdParty',
            functionCategory: '视频生成',
            categoryTitle: 'Veo 3.1',
            taskType: 'Text to Video',
            source: { type: 'channel', channelName: 'Google', channelId: 'google' },
            pricing: {
                domestic: { unit: '秒', tiers: [{ name: '标准版', price: 0.18, description: '1080p' }] },
                international: { unit: '秒', tiers: [{ name: '标准版', price: 0.03, description: '1080p' }] }
            },
            runCount: 3200000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 8,
            name: 'Wan 2.5',
            description: '多模态AI视频生成平台',
            modelType: 'thirdParty',
            functionCategory: '视频生成',
            categoryTitle: 'Wan',
            taskType: 'Text to Video',
            source: { type: 'channel', channelName: 'Wan', channelId: 'wan' },
            pricing: {
                domestic: { unit: '秒', tiers: [{ name: '标准版', price: 0.22, description: '1080p' }] },
                international: { unit: '秒', tiers: [{ name: '标准版', price: 0.035, description: '1080p' }] }
            },
            runCount: 1800000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 9,
            name: 'GPT-4o',
            description: 'OpenAI的多模态大语言模型',
            modelType: 'thirdParty',
            functionCategory: '文本生成',
            categoryTitle: '最近上新',
            taskType: 'Large Language Models',
            source: { type: 'channel', channelName: 'OpenAI', channelId: 'openai' },
            pricing: {
                domestic: { unit: '字符', tiers: [{ name: '标准版', price: 0.0008, description: '按字符计费' }] },
                international: { unit: '字符', tiers: [{ name: '标准版', price: 0.00012, description: '按字符计费' }] }
            },
            runCount: 12500000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 10,
            name: 'Claude 3.5 Sonnet',
            description: 'Anthropic的先进AI助手',
            modelType: 'thirdParty',
            functionCategory: '文本生成',
            categoryTitle: '最近上新',
            taskType: 'Large Language Models',
            source: { type: 'channel', channelName: 'Anthropic', channelId: 'anthropic' },
            pricing: {
                domestic: { unit: '字符', tiers: [{ name: '标准版', price: 0.0012, description: '按字符计费' }] },
                international: { unit: '字符', tiers: [{ name: '标准版', price: 0.00018, description: '按字符计费' }] }
            },
            runCount: 6800000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        // 最佳图像编辑模型 - 4个卡片
        {
            id: 11,
            name: 'Photoshop AI',
            description: 'Adobe的专业图像编辑AI工具',
            modelType: 'thirdParty',
            functionCategory: '图像编辑',
            categoryTitle: '最佳图像编辑模型',
            taskType: 'Image to Image',
            source: { type: 'channel', channelName: 'Adobe', channelId: 'adobe' },
            pricing: {
                domestic: { unit: '张', tiers: [{ name: '标准版', price: 0.20, description: '按张计费' }] },
                international: { unit: '张', tiers: [{ name: '标准版', price: 0.03, description: '按张计费' }] }
            },
            runCount: 4200000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 12,
            name: 'Remove.bg Pro',
            description: '专业级背景移除和图像处理',
            modelType: 'thirdParty',
            functionCategory: '图像编辑',
            categoryTitle: '最佳图像编辑模型',
            taskType: 'Image to Image',
            source: { type: 'channel', channelName: 'Remove.bg', channelId: 'removebg' },
            pricing: {
                domestic: { unit: '张', tiers: [{ name: '标准版', price: 0.03, description: '按张计费' }] },
                international: { unit: '张', tiers: [{ name: '标准版', price: 0.005, description: '按张计费' }] }
            },
            runCount: 6800000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 13,
            name: 'Upscale AI',
            description: 'AI驱动的图像超分辨率技术',
            modelType: 'thirdParty',
            functionCategory: '图像编辑',
            categoryTitle: '最佳图像编辑模型',
            taskType: 'Image to Image',
            source: { type: 'channel', channelName: 'Upscale', channelId: 'upscale' },
            pricing: {
                domestic: { unit: '张', tiers: [{ name: '标准版', price: 0.07, description: '按张计费' }] },
                international: { unit: '张', tiers: [{ name: '标准版', price: 0.01, description: '按张计费' }] }
            },
            runCount: 2300000,
            status: 'active',
            freeTag: { enabled: true, count: 5 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 14,
            name: 'Face Swap Pro',
            description: '高质量人脸替换和编辑工具',
            modelType: 'thirdParty',
            functionCategory: '图像编辑',
            categoryTitle: '最佳图像编辑模型',
            taskType: 'Image to Image',
            source: { type: 'channel', channelName: 'FaceSwap', channelId: 'faceswap' },
            pricing: {
                domestic: { unit: '张', tiers: [{ name: '标准版', price: 0.25, description: '按张计费' }] },
                international: { unit: '张', tiers: [{ name: '标准版', price: 0.04, description: '按张计费' }] }
            },
            runCount: 1800000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        // 音频模型
        {
            id: 15,
            name: 'TTS Pro',
            description: '高质量的文本转语音模型',
            modelType: 'thirdParty',
            functionCategory: '音频生成',
            categoryTitle: '音频模型',
            taskType: 'Text to Speech',
            source: { type: 'channel', channelName: 'Azure', channelId: 'azure' },
            pricing: {
                domestic: { unit: '字符', tiers: [{ name: '标准版', price: 0.0005, description: '按字符计费' }] },
                international: { unit: '字符', tiers: [{ name: '标准版', price: 0.00008, description: '按字符计费' }] }
            },
            runCount: 3200000,
            status: 'active',
            freeTag: { enabled: true, count: 5 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 16,
            name: 'MusicGen',
            description: 'AI音乐生成模型',
            modelType: 'own',
            functionCategory: '音频生成',
            categoryTitle: '音频模型',
            taskType: 'Text to Audio',
            source: { type: 'official', channelName: '官方', channelId: 'official' },
            pricing: {
                domestic: { unit: '秒', tiers: [{ name: '标准版', price: 0.12, description: '高质量音频' }] },
                international: { unit: '秒', tiers: [{ name: '标准版', price: 0.02, description: '高质量音频' }] }
            },
            runCount: 1800000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        },
        {
            id: 17,
            name: 'Whisper Large',
            description: 'OpenAI的语音识别模型',
            modelType: 'thirdParty',
            functionCategory: '音频生成',
            categoryTitle: '音频模型',
            taskType: 'Speech to Text',
            source: { type: 'channel', channelName: 'OpenAI', channelId: 'openai' },
            pricing: {
                domestic: { unit: '分钟', tiers: [{ name: '标准版', price: 0.006, description: '按分钟计费' }] },
                international: { unit: '分钟', tiers: [{ name: '标准版', price: 0.001, description: '按分钟计费' }] }
            },
            runCount: 5600000,
            status: 'active',
            freeTag: { enabled: false, count: 0 },
            image: null,
            regions: ['domestic', 'international']
        }
    ];
    
    // 合并 localStorage 中的数据（包括示例数据）
    // 将 localStorage 中的数据和测试数据合并，避免重复
    const allApis = [...testApis];
    const existingIds = new Set(testApis.map(api => api.id));
    
    // 添加 localStorage 中不存在于测试数据中的 API
    apisFromStorage.forEach(api => {
        if (!existingIds.has(api.id) && api.status === 'active') {
            allApis.push(api);
        }
    });
    
    // 保存所有API数据到全局变量
    window._allApisData = allApis;
    
    // 如果是模型详情页，只加载数据，不执行DOM操作
    if (window._isModelDetailPage) {
        return;
    }
    
    // 初始化Hero区域（默认选中Nano Banana，查找实际数据）
    const nanoBananaApi = allApis.find(api => api.name === 'Nano Banana');
    if (nanoBananaApi) {
        updateHeroWithApi(nanoBananaApi);
    } else if (allApis.length > 0) {
        // 如果没有找到Nano Banana，使用第一个，但确保设置了apiId
        updateHeroWithApi(allApis[0]);
    }
    
    // 确保hero-section有apiId属性（即使默认数据也要设置）
    const heroSection = document.querySelector('.hero-section');
    if (heroSection && !heroSection.dataset.apiId && allApis.length > 0) {
        heroSection.dataset.apiId = nanoBananaApi?.id || allApis[0].id;
    }
    
    // 渲染API卡片
    renderApiCards(allApis);
    
    // 更新筛选选项的数量
    updateFilterCounts();
}

// 全量分类视图：只展示该分类下的全部模型，隐藏轮播按钮（已废弃，改用新页面）
function showFullCategoryView(categoryTitle) {
    // 此函数已不再使用，因为现在点击分类标题会打开新页面
}

// 使用API数据更新Hero区域
function updateHeroWithApi(api) {
    const heroSection = document.querySelector('.hero-section');
    const modelTag = document.querySelector('.model-tag');
    const modelName = document.querySelector('.model-name');
    const modelDescription = document.querySelector('.model-description');
    
    // 保存apiId到hero-section的data属性
    if (heroSection && api.id) {
        heroSection.dataset.apiId = api.id;
    }
    
    // 显示任务类型标签，而不是功能分类
    if (modelTag) modelTag.textContent = api.taskType || api.functionCategory;
    if (modelName) modelName.textContent = api.name;
    if (modelDescription) modelDescription.textContent = api.description;
}

// 渲染API卡片
function renderApiCards(apis) {
    const categorySections = document.querySelectorAll('.category-section');
    
    // 清除之前的绑定标记（如果需要重新绑定）
    categorySections.forEach(section => {
        const prevBtn = section.querySelector('.carousel-prev');
        const nextBtn = section.querySelector('.carousel-next');
        const titleBtn = section.querySelector('.category-title-btn');
        if (prevBtn) prevBtn._bound = false;
        if (nextBtn) nextBtn._bound = false;
        if (titleBtn) titleBtn._bound = false;
    });
    
    // 按分类标题分组API
    const apisByCategoryTitle = {};
    apis.forEach(api => {
        if (!apisByCategoryTitle[api.categoryTitle]) {
            apisByCategoryTitle[api.categoryTitle] = [];
        }
        apisByCategoryTitle[api.categoryTitle].push(api);
    });
    
    // 更新每个分类的API卡片（分页，每页6个）
    categorySections.forEach(section => {
        const titleBtn = section.querySelector('.category-title-btn');
        const modelsGrid = section.querySelector('.models-grid');
        const prevBtn = section.querySelector('.carousel-prev');
        const nextBtn = section.querySelector('.carousel-next');
        
        if (titleBtn && modelsGrid) {
            const categoryTitle = titleBtn.getAttribute('data-category') || titleBtn.querySelector('span').textContent.trim();
            const categoryApis = apisByCategoryTitle[categoryTitle] || [];

            // 保存数据到section
            section.dataset.categoryTitle = categoryTitle;
            section._allApis = categoryApis;
            section._page = 0;
            
            // 计算每页显示的数量（根据容器宽度自动计算）
            const calculatePageSize = () => {
                if (!modelsGrid || modelsGrid.offsetWidth === 0) {
                    // 如果容器还没有渲染，使用默认值
                    return 5;
                }
                const gridWidth = modelsGrid.offsetWidth;
                const cardWidth = 280; // 卡片宽度
                const gap = 24; // 卡片间距
                const cardsPerPage = Math.floor((gridWidth + gap) / (cardWidth + gap));
                return Math.max(1, cardsPerPage);
            };
            
            section._pageSize = calculatePageSize();
            
            // 监听窗口大小变化，重新计算每页显示数量
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    section._pageSize = calculatePageSize();
                    renderPage();
                }, 250);
            });

            const renderPage = () => {
                const start = section._page * section._pageSize;
                const end = start + section._pageSize;
                const displayApis = categoryApis.slice(start, end);
                modelsGrid.innerHTML = displayApis.map(api => createApiCard(api)).join('');

                const totalPages = Math.max(1, Math.ceil(categoryApis.length / section._pageSize));
                
                // 重新获取按钮引用（因为在renderPage中可能会变化）
                const currentPrevBtn = section.querySelector('.carousel-prev');
                const currentNextBtn = section.querySelector('.carousel-next');
                
                // 只有当卡片数量大于每页显示数量时才显示箭头
                if (categoryApis.length > section._pageSize) {
                    if (currentPrevBtn) {
                        currentPrevBtn.style.display = 'flex';
                        currentPrevBtn.disabled = section._page <= 0;
                        currentPrevBtn.style.opacity = section._page <= 0 ? '0.4' : '1';
                        currentPrevBtn.style.cursor = section._page <= 0 ? 'not-allowed' : 'pointer';
                    }
                    if (currentNextBtn) {
                        currentNextBtn.style.display = 'flex';
                        currentNextBtn.disabled = section._page >= totalPages - 1;
                        currentNextBtn.style.opacity = section._page >= totalPages - 1 ? '0.4' : '1';
                        currentNextBtn.style.cursor = section._page >= totalPages - 1 ? 'not-allowed' : 'pointer';
                    }
                } else {
                    if (currentPrevBtn) currentPrevBtn.style.display = 'none';
                    if (currentNextBtn) currentNextBtn.style.display = 'none';
                }

                // 不再需要重新绑定卡片点击事件，使用事件委托统一处理
            };

            // 首次渲染
            renderPage();

            // 绑定箭头按钮事件（使用事件委托，避免引用失效问题）
            section.addEventListener('click', function(e) {
                if (e.target.closest('.carousel-prev')) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (section._page > 0) {
                        section._page--;
                        renderPage();
                    }
                } else if (e.target.closest('.carousel-next')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const totalPages = Math.max(1, Math.ceil(categoryApis.length / section._pageSize));
                    if (section._page < totalPages - 1) {
                        section._page++;
                        renderPage();
                    }
                }
            });

            // 标题按钮点击 —— 在当前窗口打开新页面（使用事件委托）
            section.addEventListener('click', function(e) {
                if (e.target.closest('.category-title-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const btn = e.target.closest('.category-title-btn');
                    const catTitle = btn.getAttribute('data-category') || btn.querySelector('span')?.textContent.trim() || categoryTitle;
                    console.log('点击分类标题:', catTitle); // 调试用
                    window.location.href = `category-models.html?category=${encodeURIComponent(catTitle)}`;
                }
            });
        }
    });
}

// 创建API卡片HTML
function createApiCard(api) {
    // 生成价格显示（传入完整的api对象以便判断模型类型）
    const priceDisplay = generatePriceDisplay(api);
    
    // 根据模型名称生成背景图片路径
    // 格式：{模型名称}-bg-0.png
    // 注意：目前只有部分模型有背景图片，如果图片不存在会自动使用默认渐变背景
    const backgroundImagePath = `images/${api.name}-bg-0.png`;
    
    return `
        <div class="model-card" data-api-id="${api.id}">
            <div class="card-background">
                <img src="${backgroundImagePath}" alt="${api.name} background" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.style.display='none';" onload="this.style.display='block';">
            </div>
            <div class="card-overlay">
                <div class="card-image">
                    ${api.freeTag && api.freeTag.enabled ? `<div class="free-tag">每日限免${api.freeTag.count || 5}次</div>` : ''}
                    <button class="favorite-btn"><i class="fas fa-star"></i></button>
                </div>
                <div class="card-content">
                    <div class="footer-info">
                        <span class="run-count">${formatNumber(api.runCount)} runs</span>
                        <span class="source">${api.source.channelName}</span>
                    </div>
                    <div class="price-row">${priceDisplay}</div>
                    <h4 class="api-name">${api.name}</h4>
                    <div class="category-tag">${api.taskType}</div>
                    <p class="description">${api.description}</p>
                </div>
            </div>
        </div>
    `;
}

// 生成价格显示（模型卡片上显示起价）
function generatePriceDisplay(api) {
    // 兼容旧调用方式：如果传入的是pricing对象而不是api对象
    const isApiObject = api && api.pricing !== undefined;
    const pricing = isApiObject ? api.pricing : api;
    const modelType = isApiObject ? api.modelType : null;
    const source = isApiObject ? api.source : null;
    
    // 默认使用国内价格（￥），如果没有国内价格则使用国际价格
    const domestic = pricing?.domestic;
    const international = pricing?.international;
    const priceData = domestic || international;
    
    // 判断是否为三方模型API
    const isThirdParty = modelType === 'thirdParty' || 
                        (source && (source.channelName === '三方' || source.channelName === '第三方'));
    
    // 处理新的价格格式
    let priceText = '';
    let unit = '';
    let minPrice = null;
    
    // 如果没有价格数据，返回价格待定
    if (!priceData) {
        return '<span class="price">价格待定</span>';
    }
    
    if (priceData) {
        if (priceData.type === 'simple') {
            // 简单价格模式
            if (priceData.priceMode === 'fixed') {
                // 固定价格
                priceText = `￥${priceData.price || 0}`;
                unit = '次';
                minPrice = priceData.price || 0;
            } else {
                // 单价模式
                const displayUnit = priceData.unitMultiplier > 1 
                    ? `${priceData.unitMultiplier}${priceData.unit}` 
                    : priceData.unit;
                priceText = `￥${priceData.price || 0}`;
                unit = displayUnit;
                minPrice = priceData.price || 0;
            }
        } else if (priceData.type === 'per-call') {
            // 兼容旧格式：按次计费
            priceText = `￥${priceData.perCallPrice}`;
            unit = '次';
            minPrice = priceData.perCallPrice;
        } else if (priceData.type === 'per-second') {
            // 兼容旧格式：按时长计费
            priceText = `￥${priceData.perSecondPrice}`;
            unit = '秒';
            minPrice = priceData.perSecondPrice;
        } else if (priceData.type === 'single-dimension') {
            // 单维度价格表：显示最低价格作为起价
            if (priceData.dimensions && priceData.dimensions.length > 0) {
                const values = priceData.dimensions[0].values || [];
                if (values.length > 0) {
                    const prices = values.map(v => v.price || 0).filter(p => p > 0);
                    if (prices.length > 0) {
                        minPrice = Math.min(...prices);
                        priceText = `￥${minPrice}`;
                        unit = '起';
                    }
                }
            }
        } else if (priceData.type === 'multi-dimension') {
            // 多维度价格表：显示最低价格作为起价
            if (priceData.dimensionMatrix && priceData.dimensionMatrix.length > 0) {
                const prices = priceData.dimensionMatrix.map(m => m.price || 0).filter(p => p > 0);
                if (prices.length > 0) {
                    minPrice = Math.min(...prices);
                    priceText = `￥${minPrice}`;
                    unit = '起';
                }
            }
        } else if (priceData.tiers && priceData.tiers.length > 0) {
            // 兼容旧格式：价格阶梯
            const tier = priceData.tiers[0];
            priceText = `￥${tier.price}`;
            unit = priceData.unit || '次';
            minPrice = tier.price;
        }
    }
    
    if (!priceText) {
        return '<span class="price">价格待定</span>';
    }
    
    // 只显示价格，不显示多余文字
    // 简单价格：显示 ￥XX/次、￥XX/张、￥XX/秒 等
    // 单维度/多维度：显示 ￥XX起
    if (unit === '起') {
        return `<span class="price">${priceText}起</span>`;
    } else {
        return `<span class="price">${priceText}/${unit}</span>`;
    }
}

// 格式化数字
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 更新筛选选项的数量
function updateFilterCounts() {
    const apis = getAllActiveApis();
    const taskTypeMap = {
        'image-to-video': 'Image to Video',
        'text-to-image': 'Text to Image',
        'image-to-image': 'Image to Image',
        'text-to-audio': 'Text to Audio',
        'video-to-video': 'Video to Video',
        'text-to-speech': 'Text to Speech',
        'image-to-3d': 'Image to 3D',
        'llm': 'Large Language Models'
    };
    
    // 统计每个任务类型的API数量
    const counts = {};
    Object.keys(taskTypeMap).forEach(taskType => {
        const taskTypeName = taskTypeMap[taskType];
        counts[taskType] = apis.filter(api => api.taskType === taskTypeName).length;
    });
    
    // 更新筛选选项的数量显示
    document.querySelectorAll('.filter-option').forEach(option => {
        const taskType = option.dataset.type;
        const count = counts[taskType] || 0;
        const countSpan = option.querySelector('.count');
        if (countSpan) {
            countSpan.textContent = count;
        }
    });
}

// Hero区域交互
function addHeroInteractions() {
    const modelTabs = document.querySelectorAll('.model-tab');
    const tryBtn = document.querySelector('.btn-try');
    const docsBtn = document.querySelector('.btn-docs');
    
    // 模型标签切换
    modelTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有active类
            modelTabs.forEach(t => t.classList.remove('active'));
            
            // 添加active类到当前标签
            this.classList.add('active');
            
            // 更新Hero内容（根据实际API数据更新）
            updateHeroContent(this.dataset.model);
        });
    });
    
    // 初始化时，确保默认选中的标签对应的Hero内容正确显示
    const activeTab = document.querySelector('.model-tab.active');
    if (activeTab) {
        updateHeroContent(activeTab.dataset.model);
    }
    
    // 立即试用按钮 - 跳转到模型详情页的playground tab
    if (tryBtn) {
        tryBtn.addEventListener('click', function() {
            const heroSection = document.querySelector('.hero-section');
            const apiId = heroSection?.dataset?.apiId || '';
            
            // 如果还没有apiId，尝试从当前显示的模型名称查找
            if (!apiId) {
                const modelName = document.querySelector('.model-name')?.textContent || '';
                const allApis = window._allApisData || [];
                const currentApi = allApis.find(api => api.name === modelName);
                if (currentApi && currentApi.id) {
                    heroSection.dataset.apiId = currentApi.id;
                    window.open(`model-detail.html?id=${encodeURIComponent(currentApi.id)}#playground`, '_blank');
                    return;
                }
                showNotification('模型信息加载中，请稍后再试', 'warning');
                return;
            }
            
            window.open(`model-detail.html?id=${encodeURIComponent(apiId)}#playground`, '_blank');
        });
    }
    
    // API文档按钮 - 跳转到模型详情页的API tab
    if (docsBtn) {
        docsBtn.addEventListener('click', function() {
            const heroSection = document.querySelector('.hero-section');
            const apiId = heroSection?.dataset?.apiId || '';
            
            // 如果还没有apiId，尝试从当前显示的模型名称查找
            if (!apiId) {
                const modelName = document.querySelector('.model-name')?.textContent || '';
                const allApis = window._allApisData || [];
                const currentApi = allApis.find(api => api.name === modelName);
                if (currentApi && currentApi.id) {
                    heroSection.dataset.apiId = currentApi.id;
                    window.open(`model-detail.html?id=${encodeURIComponent(currentApi.id)}#api`, '_blank');
                    return;
                }
                showNotification('模型信息加载中，请稍后再试', 'warning');
                return;
            }
            
            window.open(`model-detail.html?id=${encodeURIComponent(apiId)}#api`, '_blank');
        });
    }
}

// 更新Hero内容 - 根据实际API数据更新
function updateHeroContent(modelType) {
    // 从所有API数据中找到对应的模型
    const allApis = window._allApisData || getAllActiveApis();
    let targetApi = null;
    
    // 根据modelType查找对应的API
    const modelNameMap = {
        'nano-banana': 'Nano Banana',
        'veo-3-1': 'Veo 3.1',
        'sora-2': 'Sora 2',
        'wan-2-5': 'Wan 2.5',
        'kling-video': 'Kling Video'
    };
    
    const modelName = modelNameMap[modelType];
    if (modelName && allApis.length > 0) {
        targetApi = allApis.find(api => api.name === modelName);
    }
    
    if (targetApi) {
        // 使用实际API数据更新
        updateHeroWithApi(targetApi);
    } else {
        // 如果还没有加载数据，使用默认数据
        const modelData = {
            'nano-banana': {
                name: 'Nano Banana',
                taskType: 'Text to Image',
                description: 'Ultra-fast text-to-image generation with high quality and low latency.'
            },
            'veo-3-1': {
                name: 'Veo 3.1',
                taskType: 'Text to Video',
                description: 'Google\'s latest video generation model with exceptional quality and creativity.'
            },
            'sora-2': {
                name: 'Sora 2',
                taskType: 'Text to Video',
                description: 'OpenAI\'s next-generation video generation model with improved capabilities.'
            },
            'wan-2-5': {
                name: 'Wan 2.5',
                taskType: 'Image to Video',
                description: 'Advanced image-to-video generation with smooth motion and high fidelity.'
            },
            'kling-video': {
                name: 'Kling Video',
                taskType: 'Image to Video',
                description: 'Kling 2.5 Turbo Pro: Top-tier image-to-video generation with unparalleled motion fluidity, cinematic visuals, and exceptional prompt precision.'
            }
        };
        
        const data = modelData[modelType];
        if (data) {
            const heroSection = document.querySelector('.hero-section');
            const modelTag = document.querySelector('.model-tag');
            const modelNameEl = document.querySelector('.model-name');
            const modelDescription = document.querySelector('.model-description');
            
            if (heroSection) heroSection.dataset.apiId = '';
            if (modelTag) modelTag.textContent = data.taskType;
            if (modelNameEl) modelNameEl.textContent = data.name;
            if (modelDescription) modelDescription.textContent = data.description;
        }
    }
}

// 搜索功能
function addSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    const suggestionTags = document.querySelectorAll('.suggestion-tag');
    const viewAllBtn = document.getElementById('viewAllBtn');
    
    // 搜索框获得焦点时，跳转到全量内容搜索页
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            // 跳转到全量内容搜索页
            window.location.href = 'all-models.html';
        });
        
        // 阻止默认的输入行为（因为点击就会跳转）
        searchInput.addEventListener('click', function(e) {
            e.preventDefault();
            this.focus();
        });
    }
    
    // 建议标签点击：跳转到全量内容搜索页并自动搜索
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const query = this.textContent.trim();
            // 跳转到全量内容搜索页，并传递搜索关键词
            window.location.href = `all-models.html?q=${encodeURIComponent(query)}`;
        });
    });
    
    // 查看所有按钮
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // 在当前窗口打开所有模型页面
            window.location.href = 'all-models.html';
        });
    }
}

// 执行搜索
function performSearch(query) {
    const searchResults = searchApis(query);
    renderApiCards(searchResults);
    
    // 显示搜索结果统计
    if (searchResults.length === 0) {
        showNotification('未找到相关模型，请调整搜索条件', 'warning');
    } else {
        showNotification(`找到 ${searchResults.length} 个相关模型`, 'success');
    }
}

// 显示所有模型
function showAllModels() {
    const apis = getAllActiveApis();
    renderApiCards(apis);
}

// 筛选功能
function addFilterFunctionality() {
    const taskTypeFilters = document.querySelectorAll('.filter-option');
    const ownModelsToggle = document.getElementById('ownModels');
    const thirdPartyModelsToggle = document.getElementById('thirdPartyModels');
    
    // 任务类型筛选
    taskTypeFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            // 切换选中状态
            this.classList.toggle('active');
            
            // 应用筛选
            applyFilters();
        });
    });
    
    // 模型归属筛选
    if (ownModelsToggle) {
        ownModelsToggle.addEventListener('change', function() {
            if (this.checked && thirdPartyModelsToggle.checked) {
                thirdPartyModelsToggle.checked = false;
            }
            applyFilters();
        });
    }
    
    if (thirdPartyModelsToggle) {
        thirdPartyModelsToggle.addEventListener('change', function() {
            if (this.checked && ownModelsToggle.checked) {
                ownModelsToggle.checked = false;
            }
            applyFilters();
        });
    }
}

// 应用筛选
function applyFilters() {
    const activeTaskTypes = Array.from(document.querySelectorAll('.filter-option.active'))
        .map(option => option.dataset.type);
    
    const ownModelsChecked = document.getElementById('ownModels').checked;
    const thirdPartyModelsChecked = document.getElementById('thirdPartyModels').checked;
    
    // 构建筛选条件
    const filters = {};
    
    if (activeTaskTypes.length > 0) {
        // 如果有多个任务类型选中，取第一个
        const taskTypeMap = {
            'image-to-video': 'Image to Video',
            'text-to-image': 'Text to Image',
            'image-to-image': 'Image to Image',
            'text-to-audio': 'Text to Audio',
            'video-to-video': 'Video to Video',
            'text-to-speech': 'Text to Speech',
            'image-to-3d': 'Image to 3D',
            'llm': 'Large Language Models'
        };
        filters.taskType = taskTypeMap[activeTaskTypes[0]];
    }
    
    if (ownModelsChecked) {
        filters.modelType = 'own';
    } else if (thirdPartyModelsChecked) {
        filters.modelType = 'thirdParty';
    }
    
    // 应用筛选
    const filteredApis = filterApis(filters);
    renderApiCards(filteredApis);
    
    // 显示筛选结果统计
    if (filteredApis.length === 0) {
        showNotification('未找到符合条件的模型，请调整筛选条件', 'warning');
    } else {
        showNotification(`筛选出 ${filteredApis.length} 个模型`, 'info');
    }
}

// 弹窗功能
function addModalFunctionality() {
    const comparisonBtn = document.getElementById('comparisonBtn');
    const comparisonModal = document.getElementById('comparisonModal');
    const modalClose = document.querySelector('.modal-close');
    
    // 打开对比弹窗
    if (comparisonBtn && comparisonModal) {
        comparisonBtn.addEventListener('click', function(e) {
            e.preventDefault();
            comparisonModal.classList.add('show');
        });
    }
    
    // 关闭弹窗
    if (modalClose && comparisonModal) {
        modalClose.addEventListener('click', function() {
            comparisonModal.classList.remove('show');
        });
    }
    
    // 点击外部关闭弹窗
    if (comparisonModal) {
        comparisonModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    }
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && comparisonModal.classList.contains('show')) {
            comparisonModal.classList.remove('show');
        }
    });
}

// 模型卡片交互（使用事件委托，只需绑定一次）
let modelCardInteractionsBound = false;
function addModelCardInteractions() {
    // 如果已经绑定过，不再重复绑定
    if (modelCardInteractionsBound) return;
    
    // 获取内容区域作为事件委托的容器
    const contentSection = document.querySelector('.content-section');
    if (!contentSection) return;
    
    // 标记为已绑定
    modelCardInteractionsBound = true;
    
    // 使用事件委托处理模型卡片点击（只需绑定一次）
    contentSection.addEventListener('click', function(e) {
        const modelCard = e.target.closest('.model-card');
        if (!modelCard) return;
        
        // 如果点击的是收藏按钮，不触发卡片点击
        if (e.target.closest('.favorite-btn')) {
            // 处理收藏按钮点击
            const favoriteBtn = e.target.closest('.favorite-btn');
            e.stopPropagation();
            e.preventDefault();
            favoriteBtn.classList.toggle('favorited');
            
            // 收藏和取消收藏状态保持一致的样式（不改变样式，只显示通知）
            if (favoriteBtn.classList.contains('favorited')) {
                showNotification('已添加到收藏', 'success');
            } else {
                showNotification('已取消收藏', 'info');
            }
            return;
        }
        
        // 模型卡片点击事件
        const apiId = modelCard.getAttribute('data-api-id');
        const apiNameEl = modelCard.querySelector('.api-name');
        const apiName = apiNameEl ? apiNameEl.textContent : '模型详情';
        
        if (apiId) {
            showNotification(`正在打开 ${apiName} 详情页面...`, 'info');
            // 跳转到模型详情页面（新窗口）
            window.open(`model-detail.html?id=${encodeURIComponent(apiId)}`, '_blank');
        }
    });
    
    // 查看全部按钮（如果有的话，也可以使用事件委托）
    const viewMoreBtns = document.querySelectorAll('.btn-view-more');
    viewMoreBtns.forEach(btn => {
        // 只绑定一次，检查是否已绑定
        if (btn._bound) return;
        btn._bound = true;
        btn.addEventListener('click', function() {
            const categoryName = this.previousElementSibling.textContent;
            showNotification(`正在打开 ${categoryName} 分类页面...`, 'info');
            // 这里应该跳转到分类页面
            // window.open(`category-url?name=${encodeURIComponent(categoryName)}`, '_blank');
        });
    });
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-size: 14px;
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        'info': 'info-circle',
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'times-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        'info': '#3b82f6',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444'
    };
    return colors[type] || '#3b82f6';
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 优化搜索性能
const debouncedSearch = debounce(performSearch, 300);

