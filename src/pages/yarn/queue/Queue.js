import React, { Fragment } from 'react';
import { Button, DatePicker, message, Radio, Select } from "antd";
import moment from "moment";
import update from 'immutability-helper';
import api from 'src/tools/api';
import { downloadFile } from "src/tools/utils";
import { BackToTop } from "src/components/LittleComponents";
import SDTable from "src/components/SDTable";
import Context from "../Context";
import {
    memoryTrendOption, cpuTrendOption, memoryTopNTrendOption, cpuTopNTrendOption,
    getSeries, getTopNTooltip, getTotalTooltip
} from "./allChartsOptions";
import { baseColumns, memoryTopNColumns, cpuTopNColumns, unSuccessColumns, getSpanSource } from "./tableColumns";
import { ControllerChart, LinkChart, LinkTable, BlockWrapper, ChartPages, ExportButton } from '../components/Block';
import { getStartAndEndTime, getXAxisData, showOrHideCrumb, } from '../yarnUtils';

const Option = Select.Option;

export default class Queue extends React.Component {
    static contextType = Context;

    state = {
        timeType: 3,
        baseTable: {
            loading: false,
            dataSource: [],
        },
        baseSummery: {
            vCores: '',
            memory: '',
        },
        memoryTrend: {
            chartOption: memoryTrendOption, // 内存总体趋势
            loading: true,
            interval: '',
            sliderParam: {},
        },
        memoryTopNTrend: {
            chartOption: memoryTopNTrendOption, // 内存TopN趋势
            loading: true,
            interval: '',
            pageIndex: 0,
        },
        memoryTopNDetail: {  // 各程序内存详情
            dataSource: [],
            loading: true,
        },
        memoryTotalSummary: {
            memory: '',
            disk: '',
        },
        cpuTrend: {
            chartOption: cpuTrendOption, // 内存总体趋势
            loading: true,
            interval: '',
            sliderParam: {},
        },
        cpuTopNTrend: {
            chartOption: cpuTopNTrendOption, // CPU TopN趋势
            loading: true,
            interval: '',
            pageIndex: 0,
        },
        cpuTopNDetail: {  // 各程序内存详情
            dataSource: [],
            loading: true,
        },
        cpuTotalSummary: {
            cpu: '',
            disk: '',
        },
        poolList: [], // 队列Select Option
        poolName: '', // 队列Select value
        unSuccess: { // 未成功
            pageIndex: 0, // 未成功/kill/未分配
            failedSource: [], // 失败列表
            killSource: [], // kill列表
            unOccupySource: [], // 未分配列表
            startTime: '',
            endTime: '',
            timeSource: '',
        },

    };

    memoryCpuData = []; // 内存趋势图数据, 用在滑块获取日期
    memoryTopNSeries = []; // 内存 TopN series 数据, 翻页作用
    cpuTopNSeries = []; // cpu TopN series 数据, 翻页作用
    memoryTopNDetailSource = []; // 内存 TopN 详情表格数据, 翻页与导出的数据作用
    cpuTopNDetailSource = []; // cpu TopN 详情表格数据, 翻页与导出的数据作用

    startTime = moment().subtract(24, "hours").format('YYYY-MM-DD HH:mm:ss');
    endTime = moment().format('YYYY-MM-DD HH:mm:ss');
    customStartTime = ''; // 自定义开始时间
    customEndTime = ''; // 自定义结束时间
    memoryLinkStartTime = ''; // 内存被联动开始时间
    memoryLinkEndTime = ''; // 内存被联动结束时间
    cpuLinkStartTime = ''; // cpu被联动开始时间
    cpuLinkEndTime = ''; // cpu被联动结束时间

    // 切换到当前tab时触发
    componentDidMount() {
        if (!this.context.clusterValue) return;
        this.getQueueList(this.context.clusterValue);
        this.getMemoryCpuTrend({ cluster: this.context.clusterValue }); // 获取内存趋势图数据并加载图表
    }

    // 当前页面刷新时会触发
    componentWillReceiveProps(nextProps, nextContext) {
        const newClusterValue = nextContext.clusterValue;
        if (nextContext.clusterRequestError) { // 请求集群有误
            this.updateState({
                memoryTrend: { loading: { $set: false } },
                memoryTopNTrend: { loading: { $set: false } },
                memoryTopNDetail: { loading: { $set: false } },
                cpuTrend: { loading: { $set: false } },
                cpuTopNTrend: { loading: { $set: false } },
                cpuTopNDetail: { loading: { $set: false } },
            });
        } else if (this.context.clusterValue !== newClusterValue) {
            this.updateState({
                timeType: { $set: 3 },
                baseTable: { loading: { $set: true } },
                memoryTrend: { loading: { $set: true }, },
                memoryTopNTrend: { loading: { $set: true }, },
                memoryTopNDetail: { loading: { $set: true } },
                cpuTrend: { loading: { $set: true }, },
                cpuTopNTrend: { loading: { $set: true }, },
                cpuTopNDetail: { loading: { $set: true } },
            });

            this.getQueueList(newClusterValue);
            this.getMemoryCpuTrend({ cluster: newClusterValue }); // 获取内存趋势图数据并加载图表
        }
    }

    updateState = (obj, callback) => {
        this.setState(update(this.state, obj), () => callback && callback());
    };

    // 获取队列列表
    getQueueList = (cluster, startTime, endTime) => {
        cluster = cluster || this.context.clusterValue;
        startTime = startTime || this.startTime;
        endTime = endTime || this.endTime;
        api.getPoolNames({
            clusterName: cluster,
            beginTime: startTime,
            endTime: endTime,
        }).then(res => {
            const response = res.data || {};
            if (response.success !== 'true') {
                message.error('获取队列失败: ' + response.msg);
                this.setState({
                    poolList: [],
                    poolName: '',
                });
                return;
            }
            const data = response.data, poolName = data[0];
            this.updateState({
                poolList: { $set: data },
                poolName: { $set: poolName },
            });

            this.getBaseList({ cluster: this.context.clusterValue, poolName: poolName });
        });
    };

    // 获取队列基本信息
    getBaseList = ({ cluster, poolName }) => {
        if (!cluster || !poolName) return;
        api.getPoolBasicInfo({
            clusterName: cluster || this.context.clusterValue,
            poolName: poolName || this.state.poolName,
        }).then(res => {
            const response = res.data;
            if (response.success !== 'true') {
                message.error('获取队列历史详情失败: ' + response.msg);
                this.updateState({
                    baseTable: {
                        loading: { $set: false },
                        dataSource: { $set: [] },
                    },
                    baseSummery: {
                        vCores: { $set: '' },
                        memory: { $set: '' },
                    },
                });
                return;
            }
            const data = response.data;
            this.updateState({
                baseTable: {
                    loading: { $set: false },
                    dataSource: { $set: data && data.poolBasicInfoDTOList },
                },
                baseSummery: {
                    vCores: { $set: data.usedVCoreNum },
                    memory: { $set: data.usedMemory },
                },
            });
        });
    };

    // 集群内存、CPU总体情况
    getMemoryCpuTrend = ({ cluster, startTime, endTime } = {}) => {
        const errorHandler = () => {
            this.updateState({
                memoryTrend: {
                    chartOption: { $set: memoryTrendOption }, // 内存总体趋势
                    loading: { $set: false },
                    interval: { $set: '' },
                },
                memoryTopNTrend: {
                    loading: { $set: false },
                    chartOption: { $set: memoryTopNTrendOption },
                    interval: { $set: '' },
                },
                memoryTopNDetail: {
                    dataSource: { $set: [] },
                    loading: { $set: false }
                },
                cpuTrend: {
                    chartOption: { $set: cpuTrendOption }, // 内存总体趋势
                    loading: { $set: false },
                    interval: { $set: '' },
                },
                cpuTopNTrend: {
                    loading: { $set: false },
                    chartOption: { $set: cpuTopNTrendOption },
                    interval: { $set: '' },
                },
                cpuTopNDetail: {
                    dataSource: { $set: [] },
                    loading: { $set: false }
                },
            });
            this.memoryCpuData = [];
        };
        cluster = cluster || this.context.clusterValue;
        startTime = startTime || this.startTime;
        endTime = endTime || this.endTime;
        api.getPoolCpuAndMemoryTrend({
            clusterName: cluster,
            beginTime: startTime,
            endTime: endTime,
        })
            .then(res => {
                const response = res.data;
                if (response.success !== 'true') {
                    message.error('获取集群内存、CPU趋势失败: ' + response.msg);
                    errorHandler();
                    return;
                }

                const data = response.data || [];
                this.memoryCpuData = data.pools.reverse() || [];
                const exampleData = this.memoryCpuData[0].series;

                // 计算被联动的开始结束时间
                const startPosition = 75, endPosition = 100;
                const startIndex = Math.floor(startPosition / 100 * exampleData.length - 1);
                const endIndex = Math.floor(endPosition / 100 * exampleData.length - 1);
                const startTime = exampleData[startIndex].time;
                const endTime = exampleData[endIndex].time;
                // 根据联动时间获取TopN图
                this.memoryLinkStartTime = startTime;
                this.memoryLinkEndTime = endTime;
                this.cpuLinkStartTime = startTime;
                this.cpuLinkEndTime = endTime;
                // 如果没有获取到队列名,则用data.pools中的第一个队列名
                const poolName = this.state.poolName || data.pools[0].poolName;
                this.getMemoryTopNTrend({ cluster, poolName, startTime, endTime });
                this.getCpuTopNTrend({ cluster, poolName, startTime, endTime });
                this.getUnSucceedProgram({ cluster, poolName, startTime, endTime });

                let xAxis = [], memorySeries = [], cpuSeries = [], legend = [];
                const split = Math.round(exampleData.length / 5);
                const interval = data.intervalCode;
                this.memoryCpuData.forEach((item, i) => {
                    let memoryData = [], cpuData = [];
                    item.series && item.series.forEach((d, j) => {
                        i === 0 && xAxis.push(getXAxisData(d.time, j, interval, exampleData.length, split, xAxis));
                        memoryData.push(Math.round(d.totalMemoryGB));
                        cpuData.push(Math.round(d.totalCpu));
                    });
                    legend.unshift(item.poolName);
                    memorySeries.push(getSeries(i, item.poolName, memoryData, true));
                    cpuSeries.push(getSeries(i, item.poolName, cpuData, true));
                });
                this.updateState({
                    memoryTrend: {
                        loading: { $set: false },
                        interval: { $set: interval },
                        chartOption: {
                            legend: { data: { $set: legend } },
                            tooltip: {
                                formatter: {
                                    $set: (params) => {
                                        return getTotalTooltip(params, this.memoryCpuData, 'memory');
                                    }
                                }
                            },
                            xAxis: {
                                0: { data: { $set: xAxis } },
                            },
                            series: { $set: memorySeries },
                        },
                        sliderParam: {
                            $set: {
                                startPosition,
                                endPosition,
                                startTime: startTime.slice(0, 16),
                                endTime: endTime.slice(0, 16),
                            }
                        }
                    },
                    cpuTrend: {
                        loading: { $set: false },
                        interval: { $set: interval },
                        chartOption: {
                            legend: { data: { $set: legend } },
                            tooltip: {
                                formatter: {
                                    $set: (params) => {
                                        return getTotalTooltip(params, this.memoryCpuData, 'cpu');
                                    }
                                }
                            },
                            xAxis: {
                                0: { data: { $set: xAxis } },
                            },
                            series: { $set: cpuSeries },
                        },
                        sliderParam: {
                            $set: {
                                startPosition,
                                endPosition,
                                startTime: startTime.slice(0, 16),
                                endTime: endTime.slice(0, 16),
                            }
                        }
                    },
                    unSuccess: {
                        startTime: { $set: this.memoryLinkStartTime },
                        endTime: { $set: this.memoryLinkEndTime },
                        timeSource: { $set: '内存' },
                    },
                });
            })
            .catch((e) => {
                console.error(e);
                errorHandler();
            });
    };

    // 区间内内存TOPN程序趋势图
    getMemoryTopNTrend = ({ cluster, poolName, startTime, endTime } = {}) => {
        const errorHandler = () => {
            this.setState({
                memoryTopNTrend: {
                    loading: false,
                    interval: '',
                    chartOption: memoryTopNTrendOption,
                    pageIndex: 0,
                },
                memoryTopNDetail: {
                    dataSource: [],
                    loading: false
                },
            });
            this.memoryTopNSeries = [];
            this.memoryTopNDetailSource = null;
        };
        const params = {
            clusterName: cluster || this.context.clusterValue,
            poolName: poolName || this.state.poolName,
            beginTime: startTime || this.memoryLinkStartTime || this.startTime,
            endTime: endTime || this.memoryLinkEndTime || this.endTime,
        };
        api.getTopProgramMemoryByPool(params)
            .then(res => {
                const response = res.data;
                const data = response.data || [];
                if (response.success !== 'true' || (!data.programInfos || !data.programInfos[0])) {
                    response.success !== 'true' && message.error('获取区间内内存程序趋势失败: ' + response.msg);
                    errorHandler();
                    return;
                }

                this.getMemoryTopNDetail(params);
                const exampleData = data.programInfos[0].programInfos;
                const split = Math.round(exampleData.length / 5);
                const interval = data.interval;

                // 分top10与top11-20两组. echart是从越靠后的数据越在stack的上面, 需要reverse
                const groupData = [data.programInfos.slice(0, 10).reverse(), data.programInfos.slice(10, 20).reverse()];
                // 每个组循环, 生成各组的series
                this.memoryTopNSeries = [];
                groupData.forEach((group) => {
                    let xAxis = [], series = [], legend = [];
                    group.forEach((first, i) => {
                        let seriesData = [];
                        first.programInfos && first.programInfos.forEach((d, j, source) => {
                            // first.programInfos的length与time是相同的, x轴标签在组内第一个循环中添加标签
                            i === 0 && xAxis.push(getXAxisData(d.time, j, data.interval, source.length, split, xAxis));
                            seriesData.push(d.allocatedMemoryGB);
                        });
                        legend.push(first.programId);
                        series.push(getSeries(i, first.programId, seriesData))
                    });
                    this.memoryTopNSeries.push({ legend, series, xAxis, source: group });
                });
                const pageIndex = this.state.memoryTopNTrend.pageIndex;
                const top10 = this.memoryTopNSeries[pageIndex];
                this.updateState({
                    memoryTopNTrend: {
                        loading: { $set: false },
                        interval: { $set: interval },
                        chartOption: {
                            legend: { data: { $set: top10.legend.reverse() } },
                            tooltip: {
                                formatter: {
                                    $set: (params) => {
                                        return getTopNTooltip(params, this.memoryTopNSeries[pageIndex].source);
                                    }
                                }
                            },
                            xAxis: {
                                0: { data: { $set: top10.xAxis } },
                            },
                            series: { $set: top10.series },
                        },
                    },
                });
            })
            .catch((e) => {
                console.error(e);
                errorHandler();
            });
    };

    // 各程序内存详情
    getMemoryTopNDetail = (params) => {
        api.getTopProgramMemoryByPoolDetail(params).then(res => {
            const response = res.data;
            if (response.success !== 'true') {
                message.error('获取各程序内存详情失败: ' + response.msg);
                this.setState({
                    memoryTopNDetail: {
                        dataSource: [],
                        loading: false
                    }
                });
                this.memoryTopNDetailSource = null;
                return;
            }
            this.memoryTopNDetailSource = response;
            const data = response.data;
            this.setState({
                memoryTopNDetail: {
                    dataSource: data && data.slice(0, 10).map((d, i) => ({ ...d, index: i + 1 })),
                    loading: false
                }
            });
        });
    };

    // 区间内TOPN程序CPU趋势图
    getCpuTopNTrend = ({ cluster, poolName, startTime, endTime } = {}) => {
        const errorHandler = () => {
            this.updateState({
                cpuTopNTrend: {
                    loading: { $set: false },
                    interval: { $set: '' },
                    chartOption: { $set: cpuTopNTrendOption },
                },
                cpuTopNDetail: {
                    dataSource: { $set: [] },
                    loading: { $set: false },
                },
            });
            this.cpuTopNSeries = [];
            this.cpuTopNDetailSource = null;
        };
        const params = {
            clusterName: cluster || this.context.clusterValue,
            poolName: poolName || this.state.poolName,
            beginTime: startTime || this.cpuLinkStartTime || this.startTime,
            endTime: endTime || this.cpuLinkEndTime || this.endTime,
        };
        api.getTopProgramCpuByPool(params)
            .then(res => {
                const response = res.data;
                const data = response.data || [];
                if (response.success !== 'true' || (!data || !data.programInfos)) {
                    response.success !== 'true' && message.error('获取区间内CPU程序趋势失败: ' + response.msg);
                    errorHandler();
                    return;
                }

                this.getCpuTopNDetail(params);

                const exampleData = data.programInfos[0].programInfos;
                const split = Math.round(exampleData.length / 5);
                const interval = data.interval;

                // 分top10与top11-20两组. echart是从越靠后的数据越在stack的上面, 需要reverse
                const groupData = [data.programInfos.slice(0, 10).reverse(), data.programInfos.slice(10, 20).reverse()];
                // 每个组循环, 生成各组的series
                this.cpuTopNSeries = [];
                groupData.forEach((group) => {
                    let xAxis = [], series = [], legend = [];
                    group.forEach((first, i) => {
                        let seriesData = [];
                        first.programInfos && first.programInfos.forEach((d, j, source) => {
                            // first.programInfos的length与time是相同的, x轴标签在组内第一个循环中添加标签
                            i === 0 && xAxis.push(getXAxisData(d.time, j, data.interval, source.length, split, xAxis));
                            seriesData.push(d.allocatedMemoryGB);
                        });
                        legend.push(first.programId);
                        series.push(getSeries(i, first.programId, seriesData))
                    });
                    this.cpuTopNSeries.push({ legend, series, xAxis, source: group });
                });
                const pageIndex = this.state.cpuTopNTrend.pageIndex;
                const top10 = this.cpuTopNSeries[pageIndex];
                this.updateState({
                    cpuTopNTrend: {
                        loading: { $set: false },
                        interval: { $set: interval },
                        chartOption: {
                            legend: { data: { $set: top10.legend.reverse() } },
                            tooltip: {
                                formatter: {
                                    $set: (params) => {
                                        return getTopNTooltip(params, this.cpuTopNSeries[pageIndex].source);
                                    }
                                }
                            },
                            xAxis: {
                                0: { data: { $set: top10.xAxis } },
                            },
                            series: { $set: top10.series },
                        },
                        pageIndex: { $set: pageIndex }
                    }
                });
            })
            .catch((e) => {
                console.error(e);
                errorHandler();
            });
    };

    // 区间内TOPN程序CPU详情
    getCpuTopNDetail = (params) => {
        api.getTopProgramCpuByPoolDetail(params).then(res => {
            const response = res.data;
            if (response.success !== 'true') {
                message.error('获取各程序内存详情失败: ' + response.msg);
                this.setState({
                    cpuTopNDetail: {
                        dataSource: [],
                        loading: false
                    }
                });
                this.cpuTopNDetailSource = null;
                return;
            }
            this.cpuTopNDetailSource = response;
            const data = response.data;
            this.setState({
                cpuTopNDetail: {
                    dataSource: data && data.slice(0, 10).map((d, i) => ({ ...d, index: i + 1 })),
                    loading: false
                }
            });
        });
    };

    // 获取未成功列表
    getUnSucceedProgram = ({ cluster, poolName, startTime, endTime } = {}) => {
        const pageSize = 10;
        api.getUnsucceedPool({
            clusterName: cluster || this.context.clusterValue,
            beginTime: startTime || this.state.unSuccess.startTime || this.memoryLinkStartTime,
            endTime: endTime || this.state.unSuccess.endTime || this.memoryLinkEndTime,
            poolName: poolName || this.state.poolName
        }).then(res => {
            const response = res.data;
            if (response.success !== 'true') {
                message.error('获取区间内未成功程序详情失败: ' + response.msg);
                return;
            }
            const data = response.data;
            this.updateState({
                unSuccess: {
                    failedSource: { $set: getSpanSource(data.FAILED, pageSize) },
                    killSource: { $set: getSpanSource(data.KILLED, pageSize) },
                    unOccupySource: { $set: getSpanSource(data.ACCEPTED, pageSize) },
                }
            });
        })
            .catch((e) => {
                console.error(e);
            });
    };

    // 刷新
    refresh = (startTime, endTime) => {
        this.updateState({
            memoryTrend: {
                loading: { $set: true },
            },
            memoryTopNTrend: {
                loading: { $set: true },
            },
            memoryTopNDetail: {
                loading: { $set: true }
            },
            cpuTrend: {
                loading: { $set: true },
            },
            cpuTopNTrend: {
                loading: { $set: true },
            },
            cpuTopNDetail: {
                loading: { $set: true }
            },
        }, () => {
            this.getMemoryCpuTrend({
                startTime: startTime || this.startTime,
                endTime: endTime || this.endTime
            });
        });
    };

    // 切换队列值
    onQueueChange = (value) => {
        this.updateState({
            poolName: { $set: value },
            memoryTopNTrend: {
                loading: { $set: true },
            },
            memoryTopNDetail: {
                loading: { $set: true }
            },
            cpuTopNTrend: {
                loading: { $set: true },
            },
            cpuTopNDetail: {
                loading: { $set: true }
            },
        }, () => {
            this.setState({ poolName: value }, () => {
                this.getMemoryTopNTrend({ poolName: value });
                this.getCpuTopNTrend({ poolName: value });
                this.getBaseList({ poolName: value });
                this.getUnSucceedProgram({ poolName: value });
            });
        });
    };

    // 总体时间筛选
    onTimeChange = (e) => {
        const type = e.target.value;
        let startTime = '', endTime = '';
        if (!type) { // type为自定义
            if (this.customStartTime && this.customEndTime) {
                startTime = this.customStartTime;
                endTime = this.customEndTime;
            }
        } else {
            const time = getStartAndEndTime(type);
            startTime = time.startTime;
            endTime = time.endTime;
        }
        this.startTime = startTime;
        this.endTime = endTime;
        this.setState({ timeType: type }, () => startTime && endTime && this.refresh());
    };

    // 总体时间自定义
    onCustomTimeChange = (attr) => (obj, time) => {
        this[attr] = time;
        if (this.customStartTime && this.customEndTime) {
            if (this.customStartTime >= this.customEndTime) {
                message.error('开始时间必须小于结束时间');
                return;
            }

            this.refresh(this.customStartTime, this.customEndTime);
        }
    };

    // 趋势图滑块拖动
    trendSliderEvent = (start, end) => {
        const source = this.memoryCpuData[0] && this.memoryCpuData[0].series ? this.memoryCpuData[0].series : [];
        const len = source.length;
        if (!source.length) return;

        const startIndex = Math.floor(start * len - 1);
        const endIndex = Math.floor(end * len - 1);
        const startTime = source[startIndex < 0 ? 0 : startIndex].time;
        const endTime = source[endIndex > len - 1 ? len - 1 : endIndex].time;
        if (startTime === this.memoryLinkStartTime && endTime === this.memoryLinkEndTime) return;
        this.memoryLinkStartTime = startTime;
        this.memoryLinkEndTime = endTime;
        this.updateState({
            memoryTrend: {
                sliderParam: {
                    $set: {
                        startTime: startTime.slice(0, 16),
                        endTime: endTime.slice(0, 16),
                    }
                }
            },
            memoryTopNTrend: {
                loading: { $set: true },
            },
            memoryTopNDetail: {
                loading: { $set: true }
            },
            unSuccess: {
                startTime: { $set: this.memoryLinkStartTime },
                endTime: { $set: this.memoryLinkEndTime },
                timeSource: { $set: '内存' },
            },
        }, () => {
            this.getMemoryTopNTrend({ startTime, endTime });
        });

    };

    // cpu图滑块拖动
    cpuSliderEvent = (start, end) => {
        const source = this.memoryCpuData[0] && this.memoryCpuData[0].series ? this.memoryCpuData[0].series : [];
        const len = source.length;
        if (!source.length) return;

        const startIndex = Math.floor(start * len - 1);
        const endIndex = Math.floor(end * len - 1);
        const startTime = source[startIndex < 0 ? 0 : startIndex].time;
        const endTime = source[endIndex > len - 1 ? len - 1 : endIndex].time;
        if (startTime === this.cpuLinkStartTime && endTime === this.cpuLinkEndTime) return;
        this.cpuLinkStartTime = startTime;
        this.cpuLinkEndTime = endTime;
        this.updateState({
            cpuTrend: {
                sliderParam: {
                    $set: {
                        startTime: startTime.slice(0, 16),
                        endTime: endTime.slice(0, 16),
                    }
                }
            },
            cpuTopNTrend: {
                loading: { $set: true },
            },
            cpuTopNDetail: {
                loading: { $set: true }
            },
            unSuccess: {
                startTime: { $set: this.cpuLinkStartTime },
                endTime: { $set: this.cpuLinkEndTime },
                timeSource: { $set: 'CPU' },
            },
        }, () => {
            this.getCpuTopNTrend({ startTime, endTime });
        });
    };

    // TopN图翻页
    onTopNPageChange = (type) => (page) => {
        let trendAttr, trendSeriesAttr, detailAttr;
        switch (type) {
            case 'memory':
                trendAttr = 'memoryTopNTrend';
                trendSeriesAttr = 'memoryTopNSeries';
                break;
            case 'cpu':
                trendAttr = 'cpuTopNTrend';
                trendSeriesAttr = 'cpuTopNSeries';
                break;
            default:
                return;
        }
        this.updateState({
            [trendAttr]: {
                loading: { $set: true },
            },
            [detailAttr]: {
                loading: { $set: true },
            },
        }, () => {
            const currentData = this[trendSeriesAttr][page] || {};
            this.updateState({
                [trendAttr]: {
                    loading: { $set: false },
                    pageIndex: { $set: page },
                    chartOption: {
                        series: { $set: currentData.series },
                        legend: { data: { $set: currentData.legend.reverse() } },
                        xAxis: { data: { $set: currentData.xAxis } },
                        tooltip: {
                            formatter: {
                                $set: (params) => {
                                    return getTopNTooltip(params, currentData.source);
                                }
                            }
                        },
                    },
                },
            });
        });
    };

    // 导出内存TopN数据
    exportTopNDetail = (type) => () => {
        let data, url;
        switch (type) {
            case 'memory':
                data = this.memoryTopNDetailSource;
                url = 'exportPoolMemoryToExcel';
                break;
            case 'cpu':
                data = this.cpuTopNDetailSource;
                url = 'exportPoolCpuToExcel';
                break;

            default:
                return;
        }
        if (!data) {
            message.error('无可导出数据');
            return;
        }
        api[url](data).then(res => downloadFile(res));
    };

    // 切换未成功/kill/未分配
    onUnSuccessPageChange = (value) => {
        this.updateState({
            unSuccess: {
                pageIndex: { $set: value }
            }
        });
    };

    // 滚动使面包屑导航栏隐藏
    onScroll = (scrollTop) => showOrHideCrumb(scrollTop);

    render() {
        const state = this.state;
        const { baseSummery, timeType, memoryTopNTrend, cpuTopNTrend, unSuccess } = state;
        return (
            <Fragment>
                <BackToTop wrapperId='routerWrapper' onScroll={this.onScroll}/>

                <div>
                    <div
                        className="block-title"
                        style={{ fontSize: '16px', margin: '19px 0 7px', overflow: 'hidden' }}
                    >
                        队列内存CPU趋势图
                        <div style={{ float: 'right' }}>
                            <Radio.Group
                                className="radio-button" onChange={this.onTimeChange}
                                value={timeType}>
                                <Radio.Button key={'time_running_' + 1} value={1}>最近6小时</Radio.Button>
                                <Radio.Button key={'time_running_' + 2} value={2}>最近12小时</Radio.Button>
                                <Radio.Button key={'time_running_' + 3} value={3}>最近24小时</Radio.Button>
                                <Radio.Button key={'time_running_' + 4} value={4}>最近7天</Radio.Button>
                                <Radio.Button key={'time_running_' + 0} value={0}>自定义</Radio.Button>
                            </Radio.Group>
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                placeholder="开始时间"
                                disabled={timeType !== 0}
                                style={{ width: '160px', minWidth: '160px', marginRight: '12px' }}
                                onChange={this.onCustomTimeChange('customStartTime')}/>
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                placeholder="结束时间"
                                disabled={timeType !== 0}
                                style={{ width: '160px', minWidth: '160px', marginRight: '12px' }}
                                onChange={this.onCustomTimeChange('customEndTime')}/>

                            <Button htmlType="button"
                                    type="primary"
                                    className="sd-minor no-gradient"
                                    onClick={this.refresh}
                                    style={{ height: '30px', lineHeight: '30px', fontSize: '13px' }}
                            >刷新</Button>
                        </div>
                    </div>

                    <div className="part block-wrapper">
                        <BlockWrapper
                            className="block-wrapper left white-bg"
                            title={<div>
                                队列内存趋势图
                                <span className="sd-sub-title">
                                    总内存： {baseSummery.memory}
                                </span>
                            </div>}
                        >
                            <ControllerChart
                                id='poolMemoryTrend'
                                sliderEvent={this.trendSliderEvent}
                                {...state.memoryTrend}/>
                        </BlockWrapper>

                        <BlockWrapper
                            className="block-wrapper right white-bg"
                            title={<div>
                                队列CPU趋势图
                                <span className="sd-sub-title">
                                    总CPU： {baseSummery.vCores} 个
                                </span>
                            </div>}
                        >
                            <ControllerChart
                                id='poolCpuTrend'
                                sliderEvent={this.cpuSliderEvent}
                                {...state.cpuTrend}/>
                        </BlockWrapper>
                    </div>
                </div>


                <div>
                    <div
                        className="block-title"
                        style={{ fontSize: '16px', margin: '19px 0 7px', overflow: 'hidden' }}
                    >
                        基本信息
                        <span style={{
                            fontSize: '13px',
                            fontFamily: 'SourceHanSansCN-Regular',
                            fontWeight: '400',
                            color: 'rgba(128,128,128,1)',
                            marginLeft: '20px',
                        }}>
                            YARN 正在使用 {baseSummery.vCores} vcores 和内存{baseSummery.memory}
                        </span>
                    </div>

                    <div className="box-shadow block-wrapper margin-for-shadow">
                        <SDTable
                            id="poolBaseTable"
                            rowKey="index"
                            columns={baseColumns}
                            className="sd-table-simple"
                            style={{ padding: '16px' }}
                            bordered={true}
                            pagination={false}
                            noEmptyImg={true}
                            {...state.baseTable}
                        />
                    </div>
                </div>

                <div>
                    <div
                        className="block-title"
                        style={{ fontSize: '16px', margin: '19px 0 7px', overflow: 'hidden' }}
                    >
                        队列区间内程序内存CPU趋势图
                        <div style={{ float: 'right', fontSize: '13px', color: '#404040' }}>
                            队列选择：
                            <Select
                                style={{
                                    width: '153px',
                                    verticalAlign: 'middle',
                                    marginLeft: '10px',
                                }}
                                notFoundContent="暂无数据"
                                value={state.poolName}
                                onChange={this.onQueueChange}
                                placeholder="队列选择"
                            >
                                {state.poolList.map(d => <Option key={d}>{d}</Option>)}
                            </Select>
                        </div>
                    </div>

                    <div className="part box-shadow block-wrapper">
                        <BlockWrapper
                            className="block-wrapper left"
                            title='区间内程序内存趋势图'
                            isShowTitleExtra={memoryTopNTrend.chartOption.series.length > 10}
                            titleExtra={
                                <ChartPages
                                    pageIndex={memoryTopNTrend.pageIndex}
                                    onPageChange={this.onTopNPageChange('memory')}/>
                            }
                        >
                            <LinkChart id='poolMemoryTopNTrend'{...memoryTopNTrend}/>
                        </BlockWrapper>

                        <BlockWrapper
                            className="block-wrapper right"
                            title='区间内程序CPU趋势图'
                            isShowTitleExtra={cpuTopNTrend.chartOption.series.length > 10}
                            titleExtra={
                                <ChartPages
                                    pageIndex={cpuTopNTrend.pageIndex}
                                    onPageChange={this.onTopNPageChange('cpu')}/>
                            }
                        >
                            <LinkChart id='poolCpuTopNTrend'{...cpuTopNTrend}/>
                        </BlockWrapper>

                        <BlockWrapper
                            className="block-wrapper left no-title-border"
                            title='程序详情'
                            isShowTitleExtra={true}
                            titleExtra={<ExportButton exportExcel={this.exportTopNDetail('memory')}/>}
                        >
                            <LinkTable options={{
                                id: 'poolMemoryDetail',
                                rowKey: 'index',
                                columns: memoryTopNColumns,
                                ...state.memoryTopNDetail,
                            }}/>
                        </BlockWrapper>
                        <BlockWrapper
                            className="block-wrapper right no-title-border"
                            title='程序详情'
                            isShowTitleExtra={true}
                            titleExtra={<ExportButton exportExcel={this.exportTopNDetail('cpu')}/>}
                        >
                            <LinkTable options={{
                                id: 'poolCpuDetail',
                                rowKey: 'index',
                                columns: cpuTopNColumns,
                                ...state.cpuTopNDetail,
                            }}/>
                        </BlockWrapper>
                    </div>
                </div>

                <div>
                    <div className="block-title" style={{ fontSize: '16px', margin: '19px 0 7px' }}>
                        区间内未成功程序详情
                    </div>

                    <div className="block-wrapper box-shadow margin-for-shadow" style={{ padding: '12px' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <Radio.Group
                                className="radio-button"
                                onChange={(e) => this.onUnSuccessPageChange(e.target.value)}
                                value={unSuccess.pageIndex}
                            >
                                <Radio.Button key={'unSuccess' + 0} value={0}>失败</Radio.Button>
                                <Radio.Button key={'unSuccess' + 1} value={1}>KILL</Radio.Button>
                                <Radio.Button key={'unSuccess' + 2} value={2}>未分配</Radio.Button>
                            </Radio.Group>

                            {
                                unSuccess.timeSource ? (
                                    <span style={{
                                        fontSize: '13px',
                                        fontFamily: 'SourceHanSansCN-Regular',
                                        fontWeight: '400',
                                        color: 'rgba(128,128,128,1)',
                                        verticalAlign: 'bottom',
                                    }}
                                    >
                                        时间：{unSuccess.startTime} ~ {unSuccess.endTime} ({unSuccess.timeSource}区间)
                                    </span>) : null
                            }
                        </div>

                        <div style={{ position: 'relative', height: '400px' }}>
                            <div className={`un-success-tables${unSuccess.pageIndex === 0 ? ' show' : ''}`}>
                                <SDTable
                                    rowKey="index"
                                    columns={unSuccessColumns}
                                    dataSource={unSuccess.failedSource}
                                    className="sd-table-simple outside-bordered"
                                    scroll={{ x: '130%', y: 300 }}
                                />
                            </div>
                            <div className={`un-success-tables${unSuccess.pageIndex === 1 ? ' show' : ''}`}>
                                <SDTable
                                    rowKey="index"
                                    columns={unSuccessColumns}
                                    dataSource={unSuccess.killSource}
                                    className="sd-table-simple outside-bordered"
                                    scroll={{ x: '130%', y: 300 }}
                                />
                            </div>
                            <div className={`un-success-tables${unSuccess.pageIndex === 2 ? ' show' : ''}`}>
                                <SDTable
                                    rowKey="index"
                                    columns={unSuccessColumns}
                                    dataSource={unSuccess.unOccupySource}
                                    className="sd-table-simple outside-bordered"
                                    scroll={{ x: '130%', y: 300 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Fragment>
        )
    }
}