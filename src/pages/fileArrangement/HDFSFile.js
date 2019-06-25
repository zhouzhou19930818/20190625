import React, { useState, useEffect, Fragment } from 'react';
import styled from 'styled-components';
import { Select, Modal, Checkbox, Icon, Button, message } from 'antd';
import api from "src/tools/api";
import SDTable from "src/components/SDTable";
import { downloadFile } from "src/tools/utils";

import tableColumns, { partitionColumns } from './tableColumns';

const { Option } = Select;

// tab外框
const StyledPane = styled.div`
    box-shadow: 0 0 4px 1px rgba(80, 84, 90, 0.1);
    background: #ffffff;
    margin-bottom: 10px;
    padding: 16px;
`;

// 查询条件表单
const StyledForm = styled.div`
    height: 40px;
    line-height: 40px;
    margin-bottom: 10px;
`;

// 表单内容
const StyledFormItem = styled.div`
    display: inline-block;
    margin-right: 15px;

    & > span {
        padding-left: 10px;
    }
`;

// 下拉菜单
const StyledSelect = styled(Select)`
    display: inline-block;
    width: 160px;
    vertical-align: middle;
`;

// 按钮
const StyledButton = styled(Button)`
    height: 32px;
    border-radius: 2px;
    text-shadow: none;
    box-shadow: 0 2px 4px 0 rgba(16, 112, 225, 0.16);
    margin-right: 10px;
`;

// 查询按钮
const StyledPrimaryButton = styled(StyledButton)`
    height: 32px;
    border: none;
    background: #1B67E0;
    color: #ffffff;

    &:hover, &:active {
        background: #1B67E0 !important;
        color: #ffffff !important;
    }
`;

// 导出列选择输入框
const ExportModal = styled(Modal)`
    top: ${props => `${props.top}px`};
    left: ${props => `${props.left}px`};
    margin: 0;
`;

// 导出按钮
const ExportBtn = styled.a`
    font-size: 15px;
    float: right;
`;

// 导出列名选择checkbox
const FlexCheckboxGroup = styled(Checkbox.Group)`
    display: flex;
    flex-wrap: wrap;

    label {
        flex: 50%;
        margin: 0;
    }
`;

// 分区详情按钮
const PartitionDetailBtn = styled.span`
    cursor: ${props => `${props.disabled ? '' : 'pointer'}`};
    color: ${props => `${props.disabled ? '' : '#1890ff'}`};
`;

// 详情列表弹出框
const PartitionModal = styled(Modal)`
    .ant-modal-header {
        background: rgba(11, 114, 217, 1);

        .ant-modal-title {
            color: #F0F2F5;
        }
    }

    .ant-modal-close {
        color: #F0F2F5;
    }

    p {
        &:nth-of-type(2) {
            margin-top: 20px;
        }

        font-size: 14px;
        color: #686F7A;
    }
`;

// HDFS文件处理组件
export default function HDFSFile(props) {
    // 表格式选项列表
    const tableTypeOptions = [
        {
            name: '地市分区表',
            columns: 'regionColumns',
            value: '1'
        }, {
            name: '天（小时）分区表',
            columns: 'dailyColumns',
            value: '4, 5',
        }, {
            name: '周分区表',
            columns: 'weeklyColumns',
            value: '3',
        }, {
            name: '月分区表',
            columns: 'monthlyColumns',
            value: '2',
        }, {
            name: '其他分区表',
            columns: 'otherColumns',
            value: '7'
        },
    ];

    // 表格式选择值
    const [tableType, setTableType] = useState('1');
    // 列表查询中状态
    const [fetching, setFetching] = useState(false);
    // 列表数据
    const [dataSource, setDataSource] = useState([]);

    // 分区详情模态框显隐
    const [partitionModalVisible, setPartitionModalVisible] = useState(false);
    // 分区详情模态框基本信息数据
    const [partitionModalRecord, setPartitionModalRecord] = useState({});
    // 分区详情模态框详细信息数据
    const [partitionModalDataSource, setPartitionModalDataSource] = useState([]);

    // 导出模态框显隐
    const [exportModalVisible, setExportModalVisible] = useState(false);
    // 导出模态狂位置
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    // 导出模态狂checkbox选中值
    const [checkedColumns, setCheckedColumns] = useState(
        tableColumns[(tableTypeOptions.find(item => item.value === tableType)).columns].reduce((acc, cur) => {
            return cur.checkboxDisabled ? [...acc, cur.title] : acc
        }, [])
    );

    // 首次加载获取列表数据
    useEffect(() => {
        getHDFSList();
    }, [props.clusterValue, tableType]);

    // 表格式修改事件
    const onTableTypeChange = (value) => {
        setTableType(value);
        setCheckedColumns(tableColumns[(tableTypeOptions.find(item => item.value === value)).columns].reduce((acc, cur) => {
            return cur.checkboxDisabled ? [...acc, cur.title] : acc
        }, []));
        setDataSource([]);
    };

    // 导出模态框显隐控制
    const toggleExportModal = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();

        !exportModalVisible && setModalPosition({
            x: rect.x,
            y: rect.y + rect.height + 10
        });
        setExportModalVisible(!exportModalVisible);
    };

    // 分区详情模态框显隐控制
    const togglePartitionModal = async (record) => {
        if (!partitionModalVisible) {
            const result = await getPartitionList(record.id);

            if (!result) return;
        }

        setPartitionModalRecord(partitionModalVisible ? {} : record);
        setPartitionModalVisible(!partitionModalVisible);
    };

    // 到处模态框checkbox修改事件
    const onCheckedColumnsChange = (checkedValues) => {
        setCheckedColumns(checkedValues);
    };

    // 获取HDFS列表内容
    const getHDFSList = async () => {
        if (!props.clusterValue) return;

        try {
            await setFetching(true);

            const res = await api.getHDFSFileList({
                "clusterName": props.clusterValue,
                "tablePartitionTypes": tableType.split(',')
            });
            const data = await res.data;

            if (data.success !== 'true') {
                data.msg && message.error(data.msg);
                setDataSource([]);
                setFetching(false);
                return;
            }

            setDataSource(data.data.map(item => { return { ...item, key: item.id } }));
            setFetching(false);
        } catch (err) {
            setDataSource([]);
            setFetching(false);

            message.destroy();
            message.error('获取HDFS列表失败');
        }
    };

    // 导出HDFS列表内容
    const exportHDFS = async () => {
        const res = await api.exportHDFSFileList({
            "clusterName": props.clusterValue,
            "exportFields": checkedColumns,
            "tablePartitionTypes": tableType.split(',')
        });

        downloadFile(res);
    };

    // 获取分区详细信息
    const getPartitionList = async (id) => {
        message.loading('正在获取分区信息');

        try {
            const res = await api.getHDFSPartitionList({
                "clusterName": props.clusterValue,
                "pathId": id
            });
            const data = await res.data;

            message.destroy();
            if (data.success !== 'true') {
                message.error(data.msg);
                return false;
            }

            setPartitionModalDataSource(data.data.map((item, index) => {return {...item, key: index}}));

            return true;
        } catch (err) {
            message.destroy();
            message.error('获取分区详情信息失败');
            return false;
        }
    };

    // 获取表头
    const getColumns = () => {
        const match = tableTypeOptions.find(item => item.value === tableType);
        if (!match) return [];

        let columns = tableColumns[match.columns];

        columns.forEach(item => {
            if (item.title === '一级分区个数') {
                item.render = (text, record) => (
                    <PartitionDetailBtn
                        onClick={(e) => togglePartitionModal(record)}
                        disabled={partitionModalVisible}
                    >
                        {record.partitionMsgs ? record.partitionMsgs[0].partitionValueNum : ''}
                    </PartitionDetailBtn>
                );
            } else if (item.title === '二级分区个数') {
                item.render = (text, record) => (
                    <PartitionDetailBtn
                        onClick={(e) => togglePartitionModal(record)}
                        disabled={partitionModalVisible}
                    >
                        {record.partitionMsgs ? record.partitionMsgs[1].partitionValueNum : ''}
                    </PartitionDetailBtn>
                );
            }
        });

        return columns;
    };

    return (
        <StyledPane>
            <StyledForm>
                <StyledFormItem>
                    <span>请选择表格式：</span>
                    <StyledSelect
                        notFoundContent="暂无数据"
                        value={tableType}
                        onChange={onTableTypeChange}
                    >
                        {
                            tableTypeOptions.map(item =>
                                <Option key={item.name} value={item.value}>
                                    {item.name}
                                </Option>
                            )
                        }
                    </StyledSelect>
                </StyledFormItem>
                <StyledFormItem>
                    <StyledPrimaryButton onClick={getHDFSList} type='primary'>立即更新</StyledPrimaryButton>
                    <StyledButton onClick={toggleExportModal}>导出</StyledButton>
                </StyledFormItem>
            </StyledForm>
            <SDTable
                columns={getColumns()}
                dataSource={dataSource}
                className="sd-table-simple"
                scroll={{ x: '175%' }}
                loading={fetching}
                bordered={true}
            />

            <ExportModal
                title={
                    <Fragment>
                        选择导出字段
                        <ExportBtn
                            onClick={exportHDFS}
                        >
                            <Icon type="arrow-right" />确认导出
                        </ExportBtn>
                    </Fragment>
                }
                top={modalPosition.y}
                left={modalPosition.x}
                width={400}
                closable={false}
                maskClosable={true}
                maskStyle={{
                    background: 'none'
                }}
                visible={exportModalVisible}
                onCancel={toggleExportModal}
                footer={null}
            >
                <FlexCheckboxGroup
                    options={tableColumns[(tableTypeOptions.find(item => item.value === tableType)).columns].map(item => {
                        return {
                            label: item.title,
                            value: item.title,
                            disabled: item.checkboxDisabled
                        };
                    })}
                    value={checkedColumns}
                    onChange={onCheckedColumnsChange}
                />
            </ExportModal>

            <PartitionModal
                title='分区信息详情'
                width={960}
                closable={true}
                maskClosable={true}
                maskStyle={{
                    background: 'none'
                }}
                visible={partitionModalVisible}
                onCancel={togglePartitionModal}
                footer={null}
            >
                <p>基本信息</p>

                <SDTable
                    columns={getColumns().filter((item, index, arr) => (index < arr.length - 5))} //截去数据库、用户等信息
                    dataSource={[{ ...partitionModalRecord, key: 0 }]}
                    className="sd-table-simple"
                    scroll={{ x: '175%' }}
                    bordered={true}
                    pagination={false}
                />

                <p>详细信息</p>

                <SDTable
                    columns={partitionColumns}
                    dataSource={partitionModalDataSource}
                    className="sd-table-simple"
                    bordered={true}
                    pagination={{
                        size: 'small'
                    }}
                />
            </PartitionModal>
        </StyledPane>
    );
}