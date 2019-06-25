import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Input, Button, message } from 'antd';
import api from "src/tools/api";
import SDTable from "src/components/SDTable";
import { downloadFile } from "src/tools/utils";

import { fragmentFileColumns } from './tableColumns';

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

    &:hover {
        background: #1B67E0;
        color: #ffffff;
    }
`;

// 数字输入框
const StyledNumberInput = styled(Input)`
    width: 80px !important;
    height: 32px !important;
    margin-left: 10px !important;
    vertical-align: middle ;
`;


// 小文件处理组件
export default function FragmentFile(props) {
    // 列表查询中状态
    const [fetching, setFetching] = useState(false);
    // 列表数据
    const [dataSource, setDataSource] = useState([]);
    // 文件大小输入值
    const [fileSize, setFileSize] = useState(10);
    // 表文件数量输入值
    const [fileAmount, setFileAmount] = useState(1);

    // 首次加载获取列表数据
    useEffect(() => {
        getFragmentList();
    }, [props.clusterValue]);

    // 获取HDFS列表内容
    const getFragmentList = async () => {
        if (!props.clusterValue) return;

        try {
            await setFetching(true);

            const res = await api.getFragmentFileList({
                "clusterName": props.clusterValue,
                "fileNumBounds": parseInt(fileAmount),
                "fileSizeBounds": parseInt(fileSize),
                "top": 10
            });
            const data = await res.data;

            if (data.success !== 'true') {
                data.msg && message.error(data.msg);
                setDataSource([]);
                setFetching(false);
                return;
            }

            setDataSource(data.data.map((item, index) => { return { ...item, key: index } }));
            setFetching(false);
        } catch (err) {
            setDataSource([]);
            setFetching(false);

            message.destroy();
            message.error('获取HDFS列表失败');
        }
    };

    // 导出HDFS列表内容
    const exportFragment = async () => {
        const res = await api.exportFragmentFileList({
            "clusterName": props.clusterValue,
            "fileNumBounds": parseInt(fileAmount),
            "fileSizeBounds": parseInt(fileSize),
            "top": 10
        });

        downloadFile(res);
    };

    return (
        <StyledPane>
            <StyledForm>
                <StyledFormItem>
                    <span>{`文件大小 <`}</span>
                    <StyledNumberInput
                        type='number'
                        value={fileSize}
                        onChange={e => setFileSize(e.target.value)}
                    />
                </StyledFormItem>
                <StyledFormItem>
                    <span>{`表文件数量 >`}</span>
                    <StyledNumberInput
                        type='number'
                        value={fileAmount}
                        onChange={e => setFileAmount(e.target.value)}
                    />
                </StyledFormItem>
                <StyledFormItem>
                    <StyledPrimaryButton onClick={getFragmentList}>查询</StyledPrimaryButton>
                    <StyledButton onClick={exportFragment}>导出</StyledButton>
                </StyledFormItem>
            </StyledForm>
            <SDTable
                columns={fragmentFileColumns}
                dataSource={dataSource}
                pagination={false}
                className="sd-table-simple"
                scroll={{ x: '130%' }}
                bordered={true}
                loading={fetching}
            />
        </StyledPane>
    );
}