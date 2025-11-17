// API数据管理模块

// 从localStorage获取API数据
function getApiData() {
    const savedApis = localStorage.getItem('runninghub_apis');
    if (savedApis) {
        return JSON.parse(savedApis);
    }
    return [];
}

// 保存API数据到localStorage
function saveApiData(apis) {
    localStorage.setItem('runninghub_apis', JSON.stringify(apis));
}

// 从localStorage获取分类数据
function getCategoryData() {
    const savedCategories = localStorage.getItem('runninghub_categories');
    if (savedCategories) {
        return JSON.parse(savedCategories);
    }
    return [];
}

// 获取渠道数据
function getChannelData() {
    const savedChannels = localStorage.getItem('runninghub_channels');
    if (savedChannels) {
        return JSON.parse(savedChannels);
    }
    return [];
}

// 获取任务类型数据
function getTaskTypeData() {
    const savedTaskTypes = localStorage.getItem('runninghub_task_types');
    if (savedTaskTypes) {
        return JSON.parse(savedTaskTypes);
    }
    return [];
}

// 根据功能分类获取API
function getApisByFunctionCategory(category) {
    const apis = getApiData();
    return apis.filter(api => api.functionCategory === category && api.status === 'active');
}

// 根据分类标题获取API
function getApisByCategoryTitle(categoryTitle) {
    const apis = getApiData();
    return apis.filter(api => api.categoryTitle === categoryTitle && api.status === 'active');
}

// 根据模型类型获取API
function getApisByModelType(modelType) {
    const apis = getApiData();
    return apis.filter(api => api.modelType === modelType && api.status === 'active');
}

// 获取所有启用的API
function getAllActiveApis() {
    const apis = getApiData();
    return apis.filter(api => api.status === 'active');
}

// 根据ID获取API
function getApiById(id) {
    const apis = getApiData();
    return apis.find(api => api.id === id);
}

// 搜索API
function searchApis(query) {
    const apis = getAllActiveApis();
    const lowerQuery = query.toLowerCase();
    
    return apis.filter(api => 
        api.name.toLowerCase().includes(lowerQuery) ||
        api.description.toLowerCase().includes(lowerQuery) ||
        api.functionCategory.toLowerCase().includes(lowerQuery) ||
        api.categoryTitle.toLowerCase().includes(lowerQuery) ||
        api.taskType.toLowerCase().includes(lowerQuery)
    );
}

// 根据任务类型筛选API
function filterApisByTaskType(taskType) {
    const apis = getAllActiveApis();
    return apis.filter(api => api.taskType === taskType);
}

// 根据模型类型筛选API
function filterApisByModelType(modelType) {
    const apis = getAllActiveApis();
    return apis.filter(api => api.modelType === modelType);
}

// 根据渠道筛选API
function filterApisByChannel(channelId) {
    const apis = getAllActiveApis();
    return apis.filter(api => api.source.channelId === channelId);
}

// 根据地区筛选API
function filterApisByRegion(region) {
    const apis = getAllActiveApis();
    return apis.filter(api => api.regions.includes(region));
}

// 获取热词数据
function getHotKeywordData() {
    const savedHotKeywords = localStorage.getItem('runninghub_hot_keywords');
    if (savedHotKeywords) {
        return JSON.parse(savedHotKeywords);
    }
    return [];
}

// 获取搜索日志数据
function getSearchLogData() {
    const savedLogs = localStorage.getItem('runninghub_search_logs');
    if (savedLogs) {
        return JSON.parse(savedLogs);
    }
    return [];
}

// 获取热词配置（前端版本）
function getHotKeywordConfigForFrontend(apiType) {
    const savedConfigs = localStorage.getItem('runninghub_hot_keyword_config');
    if (savedConfigs) {
        try {
            const configs = JSON.parse(savedConfigs);
            const defaultConfig = {
                autoRatio: 0.7,
                manualRatio: 0.3,
                maxCount: 8,
                minSearchCount: 3,
                timeRange: 30
            };
            return configs[apiType] || defaultConfig;
        } catch (e) {
            console.error('解析热词配置失败:', e);
        }
    }
    // 默认配置
    return {
        autoRatio: 0.7,
        manualRatio: 0.3,
        maxCount: 8,
        minSearchCount: 3,
        timeRange: 30
    };
}

// 获取最终显示的热词列表（混合模式）
// 策略：自动获取为主（可配置），手动配置为辅（可配置）
function getFinalHotKeywordsForFrontend(apiType, region, maxCount = null) {
    // 获取配置
    const config = getHotKeywordConfigForFrontend(apiType, region);
    const finalMaxCount = maxCount || config.maxCount;
    const autoRatio = config.autoRatio;
    
    const allHotKeywords = getHotKeywordData();
    
    // 1. 获取手动配置的热词（已启用）
    const manualKeywords = allHotKeywords
        .filter(k => k.apiType === apiType && k.region === region && k.enabled !== false && k.source === 'manual')
        .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
    
    // 2. 获取自动获取的高频搜索词（从搜索日志中提取）
    const searchLogs = getSearchLogData();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - config.timeRange);
    
    const recentLogs = searchLogs.filter(log => {
        if (log.apiType !== apiType) return false;
        // 按region筛选：如果日志有region字段则精确匹配，否则根据关键词语言推断
        if (log.region) {
            if (log.region !== region) return false;
        } else {
            // 兼容旧数据：根据关键词是否包含中文判断region
            const keywordRegion = /[\u4e00-\u9fa5]/.test(log.keyword || '') ? 'cn' : 'ai';
            if (keywordRegion !== region) return false;
        }
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp);
        return logDate >= daysAgo;
    });
    
    // 统计搜索关键词频率
    const keywordCounts = {};
    recentLogs.forEach(log => {
        const keyword = log.keyword ? log.keyword.toLowerCase().trim() : '';
        if (keyword.length > 0) {
            keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
    });
    
    // 转换为热词对象（根据配置的最小搜索次数过滤）
    const autoKeywords = Object.entries(keywordCounts)
        .filter(([keyword, count]) => count >= config.minSearchCount)
        .map(([keyword, searchCount]) => ({
            keyword: keyword,
            apiType: apiType,
            source: 'auto',
            searchCount: searchCount
        }))
        .sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0));
    
    // 3. 去重：移除自动获取中与手动配置重复的热词
    const manualKeywordTexts = new Set(manualKeywords.map(k => k.keyword.toLowerCase()));
    const uniqueAutoKeywords = autoKeywords.filter(k => 
        !manualKeywordTexts.has(k.keyword.toLowerCase())
    );
    
    // 4. 计算数量分配（根据配置的比例）
    // 如果自动获取比例为0，则全部使用手动配置
    const autoCount = autoRatio > 0 ? Math.floor(finalMaxCount * autoRatio) : 0;
    const manualCount = finalMaxCount - autoCount;
    
    // 5. 合并策略：自动获取在前（优先），手动配置在后（补充）
    const selectedAuto = autoRatio > 0 ? uniqueAutoKeywords.slice(0, autoCount) : [];
    const selectedManual = manualKeywords.slice(0, manualCount);
    
    // 6. 合并：自动获取在前，手动配置在后
    let allKeywords = [...selectedAuto, ...selectedManual];
    
    // 7. 如果自动获取不足或为0，用手动配置补足
    if (allKeywords.length < finalMaxCount) {
        const remainingCount = finalMaxCount - allKeywords.length;
        const additionalManual = manualKeywords
            .slice(selectedManual.length, selectedManual.length + remainingCount)
            .filter(k => !allKeywords.some(existing => existing.keyword.toLowerCase() === k.keyword.toLowerCase()));
        allKeywords = [...allKeywords, ...additionalManual];
    }
    
    // 8. 限制数量并返回关键词文本数组
    return allKeywords.slice(0, finalMaxCount).map(k => k.keyword);
}

// 组合筛选
function filterApis(filters = {}) {
    let apis = getAllActiveApis();
    
    if (filters.taskType) {
        apis = filterApisByTaskType(filters.taskType);
    }
    
    if (filters.modelType) {
        apis = filterApisByModelType(filters.modelType);
    }
    
    if (filters.channelId) {
        apis = filterApisByChannel(filters.channelId);
    }
    
    if (filters.functionCategory) {
        apis = apis.filter(api => api.functionCategory === filters.functionCategory);
    }
    
    if (filters.categoryTitle) {
        apis = apis.filter(api => api.categoryTitle === filters.categoryTitle);
    }
    
    if (filters.region) {
        apis = filterApisByRegion(filters.region);
    }
    
    if (filters.search) {
        apis = searchApis(filters.search);
    }
    
    return apis;
}

// 获取分类统计
function getCategoryStats() {
    const apis = getAllActiveApis();
    const stats = {};
    
    apis.forEach(api => {
        if (stats[api.category]) {
            stats[api.category]++;
        } else {
            stats[api.category] = 1;
        }
    });
    
    return stats;
}

// 导出数据（用于备份）
function exportData() {
    return {
        apis: getApiData(),
        categories: getCategoryData(),
        exportTime: new Date().toISOString()
    };
}

// 导入数据（用于恢复）
function importData(data) {
    if (data.apis) {
        localStorage.setItem('runninghub_apis', JSON.stringify(data.apis));
    }
    if (data.categories) {
        localStorage.setItem('runninghub_categories', JSON.stringify(data.categories));
    }
}

// 重置数据到默认状态
function resetToDefault() {
    const defaultApis = [
        {
            id: 198600000001,
            name: 'rh-ai/Flux Kontext',
            description: '基于Flux架构的高质量图像生成模型',
            // 分类体系
            modelType: 'own', // own: 自有模型, thirdParty: 三方模型
            functionCategory: '图像生成',
            categoryTitle: '最近上新',
            categoryTitles: ['最近上新'],
            taskType: 'Text to Image',
            // 来源
            source: {
                type: 'official', // official: 官方, channel: 渠道
                channelName: '官方',
                channelId: 'official'
            },
            // 价格体系
            pricing: {
                domestic: {
                    unit: '张',
                    tiers: [
                        { name: '分辨率1', price: 0.05, description: '512x512' },
                        { name: '分辨率2', price: 0.08, description: '1024x1024' },
                        { name: '分辨率3', price: 0.12, description: '2048x2048' }
                    ]
                },
                international: {
                    unit: '张',
                    tiers: [
                        { name: '分辨率1', price: 0.008, description: '512x512' },
                        { name: '分辨率2', price: 0.012, description: '1024x1024' },
                        { name: '分辨率3', price: 0.018, description: '2048x2048' }
                    ]
                }
            },
            // 其他信息
            runCount: 1200000,
            status: 'active',
            freeTag: {
                enabled: true,
                count: 5
            },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 198600000002,
            name: 'rh-ai/Stable Diffusion XL',
            description: '最先进的文本到图像生成模型',
            modelType: 'own',
            functionCategory: '图像生成',
            categoryTitle: '最佳图像编辑模型',
            taskType: 'Text to Image',
            source: {
                type: 'official',
                channelName: '官方',
                channelId: 'official'
            },
            pricing: {
                domestic: {
                    unit: '张',
                    tiers: [
                        { name: '分辨率1', price: 0.08, description: '512x512' },
                        { name: '分辨率2', price: 0.12, description: '1024x1024' },
                        { name: '分辨率3', price: 0.18, description: '2048x2048' }
                    ]
                },
                international: {
                    unit: '张',
                    tiers: [
                        { name: '分辨率1', price: 0.012, description: '512x512' },
                        { name: '分辨率2', price: 0.018, description: '1024x1024' },
                        { name: '分辨率3', price: 0.025, description: '2048x2048' }
                    ]
                }
            },
            runCount: 5800000,
            status: 'active',
            freeTag: {
                enabled: true,
                count: 5
            },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 198600000003,
            name: 'rh-ai/DALL-E 3',
            description: 'OpenAI最新的图像生成模型',
            modelType: 'thirdParty',
            functionCategory: '图像生成',
            categoryTitle: 'Veo 3.1',
            categoryTitles: ['Veo 3.1'],
            taskType: 'Text to Image',
            source: {
                type: 'channel',
                channelName: '渠道1',
                channelId: 'channel_1'
            },
            pricing: {
                domestic: {
                    unit: '张',
                    tiers: [
                        { name: '分辨率1', price: 0.12, description: '512x512' },
                        { name: '分辨率2', price: 0.18, description: '1024x1024' },
                        { name: '分辨率3', price: 0.25, description: '2048x2048' }
                    ]
                },
                international: {
                    unit: '张',
                    tiers: [
                        { name: '分辨率1', price: 0.018, description: '512x512' },
                        { name: '分辨率2', price: 0.025, description: '1024x1024' },
                        { name: '分辨率3', price: 0.035, description: '2048x2048' }
                    ]
                }
            },
            runCount: 3200000,
            status: 'active',
            freeTag: {
                enabled: false,
                count: 5
            },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 198600000004,
            name: 'rh-ai/Sora 2',
            description: 'OpenAI最新的视频生成模型',
            modelType: 'thirdParty',
            functionCategory: '视频生成',
            categoryTitle: 'Sora2',
            categoryTitles: ['Sora2'],
            taskType: 'Text to Video',
            source: {
                type: 'channel',
                channelName: '渠道2',
                channelId: 'channel_2'
            },
            pricing: {
                domestic: {
                    unit: '秒',
                    tiers: [
                        { name: '分辨率1+时长1', price: 0.5, description: '720p-5秒' },
                        { name: '分辨率1+时长2', price: 0.8, description: '720p-10秒' },
                        { name: '分辨率2+时长1', price: 0.8, description: '1080p-5秒' },
                        { name: '分辨率2+时长2', price: 1.2, description: '1080p-10秒' },
                        { name: '分辨率3+时长1', price: 1.2, description: '4K-5秒' },
                        { name: '分辨率3+时长2', price: 1.8, description: '4K-10秒' }
                    ]
                },
                international: {
                    unit: '秒',
                    tiers: [
                        { name: '分辨率1+时长1', price: 0.08, description: '720p-5秒' },
                        { name: '分辨率1+时长2', price: 0.12, description: '720p-10秒' },
                        { name: '分辨率2+时长1', price: 0.12, description: '1080p-5秒' },
                        { name: '分辨率2+时长2', price: 0.18, description: '1080p-10秒' },
                        { name: '分辨率3+时长1', price: 0.18, description: '4K-5秒' },
                        { name: '分辨率3+时长2', price: 0.25, description: '4K-10秒' }
                    ]
                }
            },
            runCount: 2100000,
            status: 'active',
            freeTag: {
                enabled: false,
                count: 5
            },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 198600000005,
            name: 'rh-ai/Whisper',
            description: 'OpenAI的语音识别模型',
            modelType: 'thirdParty',
            functionCategory: '音频生成',
            categoryTitle: '音频模型',
            categoryTitles: ['音频模型'],
            taskType: 'Speech to Text',
            source: {
                type: 'channel',
                channelName: '渠道3',
                channelId: 'channel_3'
            },
            pricing: {
                domestic: {
                    unit: '秒',
                    tiers: [
                        { name: '标准版', price: 0.02, description: '按秒计费' },
                        { name: '专业版', price: 0.05, description: '按秒计费' }
                    ]
                },
                international: {
                    unit: '秒',
                    tiers: [
                        { name: '标准版', price: 0.003, description: '按秒计费' },
                        { name: '专业版', price: 0.008, description: '按秒计费' }
                    ]
                }
            },
            runCount: 890000,
            status: 'active',
            freeTag: {
                enabled: false,
                count: 5
            },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 198600000006,
            name: 'rh-ai/GPT-4',
            description: 'OpenAI的大型语言模型',
            modelType: 'thirdParty',
            functionCategory: '文本生成',
            categoryTitle: '最近上新',
            categoryTitles: ['最近上新'],
            taskType: 'Large Language Models',
            source: {
                type: 'channel',
                channelName: '渠道1',
                channelId: 'channel_1'
            },
            pricing: {
                domestic: {
                    unit: '字符',
                    tiers: [
                        { name: '输入', price: 0.03, description: '每1000字符' },
                        { name: '输出', price: 0.06, description: '每1000字符' }
                    ]
                },
                international: {
                    unit: '字符',
                    tiers: [
                        { name: '输入', price: 0.005, description: '每1000字符' },
                        { name: '输出', price: 0.008, description: '每1000字符' }
                    ]
                }
            },
            runCount: 1500000,
            status: 'active',
            freeTag: {
                enabled: true,
                count: 5
            },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        // 示例1：基于时长的单维度价格表（Duration vs Total）
        {
            id: 198600000007,
            name: 'rh-ai/Video Duration Pricing',
            description: '基于时长的视频生成价格表示例',
            modelType: 'own',
            functionCategory: '视频生成',
            categoryTitle: '最近上新',
            categoryTitles: ['最近上新'],
            taskType: 'Text to Video',
            source: {
                type: 'official',
                channelName: '官方',
                channelId: 'official'
            },
            pricing: {
                domestic: {
                    type: 'single-dimension',
                    dimensionName: 'Duration',
                    dimensions: [{
                        name: 'Duration',
                        values: [
                            { value: '4s', price: 0.4, priceMode: 'fixed' },
                            { value: '8s', price: 0.8, priceMode: 'fixed' },
                            { value: '12s', price: 1.2, priceMode: 'fixed' }
                        ]
                    }]
                }
            },
            runCount: 500000,
            status: 'active',
            freeTag: { enabled: false, count: 5 },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        // 示例2：基于分辨率的单维度价格表（Resolution vs Price per second）
        {
            id: 198600000008,
            name: 'rh-ai/Resolution Pricing',
            description: '基于分辨率的视频生成价格表示例',
            modelType: 'own',
            functionCategory: '视频生成',
            categoryTitle: '最近上新',
            categoryTitles: ['最近上新'],
            taskType: 'Text to Video',
            source: {
                type: 'official',
                channelName: '官方',
                channelId: 'official'
            },
            pricing: {
                domestic: {
                    type: 'single-dimension',
                    dimensionName: 'Resolution',
                    dimensions: [{
                        name: 'Resolution',
                        values: [
                            { value: '480P', price: 0.05, priceMode: 'unit', unit: '秒', unitMultiplier: 1 },
                            { value: '720P', price: 0.10, priceMode: 'unit', unit: '秒', unitMultiplier: 1 },
                            { value: '1080P', price: 0.15, priceMode: 'unit', unit: '秒', unitMultiplier: 1 }
                        ]
                    }]
                }
            },
            runCount: 300000,
            status: 'active',
            freeTag: { enabled: false, count: 5 },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        // 示例3：多维度价格表（Duration + Resolution）
        {
            id: 198600000009,
            name: 'rh-ai/Multi Dimension Pricing',
            description: '多维度价格表示例（时长+分辨率）',
            modelType: 'own',
            functionCategory: '视频生成',
            categoryTitle: '最近上新',
            categoryTitles: ['最近上新'],
            taskType: 'Text to Video',
            source: {
                type: 'official',
                channelName: '官方',
                channelId: 'official'
            },
            pricing: {
                domestic: {
                    type: 'multi-dimension',
                    dimensions: [
                        {
                            name: 'Duration',
                            values: ['4s', '8s', '12s']
                        },
                        {
                            name: 'Resolution',
                            values: ['720*1280/1280*720', '1024*1792/1792*1024']
                        }
                    ],
                    dimensionMatrix: [
                        { params: { 0: '4s', 1: '720*1280/1280*720' }, price: 1.2, priceMode: 'fixed' },
                        { params: { 0: '8s', 1: '720*1280/1280*720' }, price: 2.4, priceMode: 'fixed' },
                        { params: { 0: '12s', 1: '720*1280/1280*720' }, price: 3.6, priceMode: 'fixed' },
                        { params: { 0: '4s', 1: '1024*1792/1792*1024' }, price: 2.0, priceMode: 'fixed' },
                        { params: { 0: '8s', 1: '1024*1792/1792*1024' }, price: 4.0, priceMode: 'fixed' },
                        { params: { 0: '12s', 1: '1024*1792/1792*1024' }, price: 6.0, priceMode: 'fixed' }
                    ]
                }
            },
            runCount: 200000,
            status: 'active',
            freeTag: { enabled: false, count: 5 },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        // 示例4：简单固定价格（$0.05/次）
        {
            id: 198600000010,
            name: 'rh-ai/Simple Fixed Price',
            description: '简单固定价格示例',
            modelType: 'own',
            functionCategory: '图像生成',
            categoryTitle: '最近上新',
            categoryTitles: ['最近上新'],
            taskType: 'Text to Image',
            source: {
                type: 'official',
                channelName: '官方',
                channelId: 'official'
            },
            pricing: {
                domestic: {
                    type: 'simple',
                    priceMode: 'fixed',
                    price: 0.05
                }
            },
            runCount: 1000000,
            status: 'active',
            freeTag: { enabled: false, count: 5 },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        // 示例5：按秒计费（$0.0007/s）
        {
            id: 198600000011,
            name: 'rh-ai/Per Second Pricing',
            description: '按秒计费示例',
            modelType: 'own',
            functionCategory: '视频生成',
            categoryTitle: '最近上新',
            categoryTitles: ['最近上新'],
            taskType: 'Text to Video',
            source: {
                type: 'official',
                channelName: '官方',
                channelId: 'official'
            },
            pricing: {
                domestic: {
                    type: 'simple',
                    priceMode: 'unit',
                    price: 0.0007,
                    unit: '秒',
                    unitMultiplier: 1
                }
            },
            runCount: 800000,
            status: 'active',
            freeTag: { enabled: false, count: 5 },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        // 示例6：基于输出分辨率和时长的价格表（Output Resolution vs Cost per 5 seconds）
        {
            id: 198600000012,
            name: 'rh-ai/Output Resolution Pricing',
            description: '基于输出分辨率和时长的价格表示例',
            modelType: 'own',
            functionCategory: '视频生成',
            categoryTitle: '最近上新',
            categoryTitles: ['最近上新'],
            taskType: 'Text to Video',
            source: {
                type: 'official',
                channelName: '官方',
                channelId: 'official'
            },
            pricing: {
                domestic: {
                    type: 'single-dimension',
                    dimensionName: 'Output Resolution',
                    dimensions: [{
                        name: 'Output Resolution',
                        values: [
                            { value: '480P (Max: 10 minutes)', price: 0.15, priceMode: 'unit', unit: '秒', unitMultiplier: 5 },
                            { value: '720P (Max: 10 minutes)', price: 0.30, priceMode: 'unit', unit: '秒', unitMultiplier: 5 }
                        ]
                    }]
                }
            },
            runCount: 400000,
            status: 'active',
            freeTag: { enabled: false, count: 5 },
            backgroundImage: '',
            regions: ['domestic', 'international'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    const defaultCategories = [
        // 功能分类
        { id: 1, name: '图像生成', description: '文本到图像生成', icon: 'fas fa-image', type: 'function' },
        { id: 2, name: '图像编辑', description: '图像处理和编辑', icon: 'fas fa-edit', type: 'function' },
        { id: 3, name: '视频生成', description: '视频生成和处理', icon: 'fas fa-video', type: 'function' },
        { id: 4, name: '音频生成', description: '音频生成和处理', icon: 'fas fa-music', type: 'function' },
        { id: 5, name: '文本生成', description: '文本生成和处理', icon: 'fas fa-file-text', type: 'function' },
        { id: 6, name: '3D生成', description: '3D模型生成', icon: 'fas fa-cube', type: 'function' },
        
        // 分类标题
        { id: 7, name: '最近上新', description: '最新上线的模型', icon: 'fas fa-star', type: 'title' },
        { id: 8, name: '最佳图像编辑模型', description: '最优秀的图像编辑模型', icon: 'fas fa-paint-brush', type: 'title' },
        { id: 9, name: 'Veo 3.1', description: 'Google视频生成模型', icon: 'fas fa-video', type: 'title' },
        { id: 10, name: 'Sora2', description: 'OpenAI视频生成模型', icon: 'fas fa-video', type: 'title' },
        { id: 11, name: 'Wan', description: '万兴视频生成模型', icon: 'fas fa-video', type: 'title' },
        { id: 12, name: '音频模型', description: '音频生成和处理模型', icon: 'fas fa-music', type: 'title' }
    ];
    
    const defaultChannels = [
        { 
            id: 'official', 
            name: '官方', 
            type: 'official',
            description: '官方渠道',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        { 
            id: 'channel_1', 
            name: 'rh-ai', 
            type: 'channel',
            description: '外部渠道1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        { 
            id: 'channel_2', 
            name: 'rh-ai', 
            type: 'channel',
            description: '外部渠道2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        { 
            id: 'channel_3', 
            name: 'rh-ai', 
            type: 'channel',
            description: '外部渠道3',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    
    const defaultTaskTypes = [
        '3D to 3D', 'Audio to Audio', 'Audio to Video', 'Image to 3D', 
        'Image to Image', 'Image to JSON', 'Image to Video', 'JSON', 
        'Large Language Models', 'Speech to Speech', 'Speech to Text', 
        'Text to 3D', 'Text to Audio', 'Text to Image', 'Text to Speech', 
        'Text to Video', 'Training', 'Video to Audio', 'Video to Video', 'Vision'
    ];
    
    localStorage.setItem('runninghub_apis', JSON.stringify(defaultApis));
    localStorage.setItem('runninghub_categories', JSON.stringify(defaultCategories));
    localStorage.setItem('runninghub_channels', JSON.stringify(defaultChannels));
    localStorage.setItem('runninghub_task_types', JSON.stringify(defaultTaskTypes));
}
