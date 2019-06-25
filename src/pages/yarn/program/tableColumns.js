import moment from "moment";
import React from 'react';

// 内存应用详情
export const memoryTopNColumns = (onNameClick) => [
    {
        title: '程序名称',
        dataIndex: 'programName',
        width: 210,
        render: (text) => (<button className="sd-anchor-button" onClick={ () => onNameClick(text) }>{ text }</button>),
    },
    {
        title: '最终状态',
        dataIndex: 'state',
        width: 100,
    },
    {
        title: '区间内最大内存',
        dataIndex: 'allocatedMaxMemory',
        sorter: (a, b) => a.allocatedMaxMemory.localeCompare(b.allocatedMaxMemory),
        width: 155,
    },
    {
        title: '区间内最大CPU',
        dataIndex: 'allocatedMaxVcore',
        sorter: (a, b) => a.allocatedMaxVcore - b.allocatedMaxVcore,
        width: 150,
    },
    {
        title: '总运行时长',
        dataIndex: 'runningTimeStr',
        sorter: (a, b) => a.runningTimeStr - b.runningTimeStr,
        width: 130,
    },
    {
        title: '开始时间',
        dataIndex: 'startTime',
        render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
        sorter: (a, b) => a.startTime.localeCompare(b.startTime),
        width: 165,
    },
    {
        title: '程序类型',
        dataIndex: 'type',
        width: 95,
    },
    {
        title: '队列',
        dataIndex: 'pool',
        width: 145,
    },
    {
        title: '租户',
        dataIndex: 'user',
        width: 75,
    },
    {
        title: '应用',
        dataIndex: 'applicationName',
        width: 95,
        render: (text) => !text || text === 'null' ? '无' : text,
    },
    {
        title: '程序ID',
        dataIndex: 'programId',
        width: 245,

    },
];

// cpu应用详情
export const cpuTopNColumns = (onNameClick) => [
    {
        title: '程序名称',
        dataIndex: 'programName',
        width: 205,
        render: (text) => (<button className="sd-anchor-button" onClick={ () => onNameClick(text) }>{ text }</button>),
    },
    {
        title: '最终状态',
        dataIndex: 'state',
        width: 100,
    },
    {
        title: '区间内最大CPU(个数)',
        dataIndex: 'allocatedMaxVcore',
        sorter: (a, b) => a.allocatedMaxVcore - b.allocatedMaxVcore,
        width: 190,
    },
    {
        title: '区间内最大内存',
        dataIndex: 'allocatedMaxMemory',
        sorter: (a, b) => (a.allocatedMaxMemory).localeCompare(b.allocatedMaxMemory),
        width: 155,
    },
    {
        title: '总运行时长',
        dataIndex: 'runningTimeStr',
        sorter: (a, b) => a.runningTimeStr - b.runningTimeStr,
        width: 130,
    },
    {
        title: '开始时间',
        dataIndex: 'startTime',
        render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
        sorter: (a, b) => (a.startTime).localeCompare(b.startTime),
        width: 160,
    },
    {
        title: '程序类型',
        dataIndex: 'type',
        width: 90,
    },
    {
        title: '队列',
        dataIndex: 'pool',
        width: 145,
    },
    {
        title: '租户',
        dataIndex: 'user',
        width: 80,
    },
    {
        title: '应用',
        dataIndex: 'applicationName',
        width: 90,
        render: (text) => !text || text === 'null' ? '无' : text,
    },
    {
        title: '程序ID',
        dataIndex: 'programId',
        width: 245,
    },
];

// 程序历史详情
export const historyColumns = [
    {
        title: '程序名称',
        dataIndex: 'programName',
        width: 240,
    },
    {
        title: '最终状态',
        dataIndex: 'state',
        width: 90,
    },
    {
        title: '已分配内存',
        dataIndex: 'allocatedMemorySeconds',
        sorter: (a, b) => (a.allocatedMemorySeconds).localeCompare(b.allocatedMemorySeconds),
        width: 125,
    },
    {
        title: '已分配CPU',
        dataIndex: 'allocatedVcoreSeconds',
        sorter: (a, b) => a.allocatedVcoreSeconds - b.allocatedVcoreSeconds,
        width: 125,
        render: (text) => text + '个*s',
    },
    {
        title: '总运行时长',
        dataIndex: 'runningTime',
        sorter: (a, b) => a.runningTime - b.runningTime,
        width: 125,
    },
    {
        title: '开始时间',
        dataIndex: 'startTime',
        render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
        sorter: (a, b) => a.startTime.localeCompare(b.startTime),
        width: 160,
    },
    {
        title: '程序类型',
        dataIndex: 'type',
        width: 90,
    },
    {
        title: '所在队列',
        dataIndex: 'pool',
        width: 130,
    },
    {
        title: '租户',
        dataIndex: 'user',
        width: 70,
    },
    {
        title: '所属应用',
        dataIndex: 'applicationName',
        width: 100,
        render: (text) => !text || text === 'null' ? '无' : text,
    },
    {
        title: '程序ID',
        dataIndex: 'programId',
        width: 245,
    },
];

// 程序运行时长
export const overRunningTimeColumns = [
    {
        title: '所属应用',
        dataIndex: 'applicationName',
        width: 80,
        render: (text) => !text || text === 'null' ? '无' : text,
    },
    {
        title: '程序名称',
        dataIndex: 'programName',
        width: 80,
    },
    {
        title: '程序类型',
        dataIndex: 'type',
        width: 80,
    },
    {
        title: '最终状态',
        dataIndex: 'state',
        width: 80,
    },
    {
        title: '总运行时长',
        dataIndex: 'runningTime',
        sorter: (a, b) => a.runningTime - b.runningTime,
        width: 110,
    },
    {
        title: 'Running时长',
        dataIndex: 'runningTime1',
        sorter: (a, b) => a.runningTime1 - b.runningTime1,
        width: 120,
    },

    {
        title: '已分配内存',
        dataIndex: 'allocatedMemorySeconds',
        sorter: (a, b) => (a.allocatedMemorySeconds).localeCompare(b.allocatedMemorySeconds),
        width: 110,
    },
    {
        title: '已分配CPU',
        dataIndex: 'allocatedVcoreSeconds',
        sorter: (a, b) => a.allocatedVcoreSeconds - b.allocatedVcoreSeconds,
        width: 110,
        render: (text) => text + '个*s',
    },
    {
        title: '所在队列',
        dataIndex: 'pool',
        width: 90,
    },
    {
        title: '租户',
        dataIndex: 'user',
        width: 60,
    },
    {
        title: '程序ID',
        dataIndex: 'programId',
        width: 80,
    },
];