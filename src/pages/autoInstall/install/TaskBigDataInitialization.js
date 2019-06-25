import React, { Fragment } from 'react';
import { Divider, Input, Modal, Button } from "antd";

import SDTable from 'src/components/SDTable';
import SelectTaskModel from './SelectTaskModel';

import { reduxMapper } from "src/redux/modules/diskTrouble";
import Context from "./Context";
// import api from 'src/tools/api';

// 0未装机，1已装机，2正在装机，3装机异常
const allStatus = ['未装机', '已装机', '正在装机', '装机异常', '人工修复（已装机）'];

class TaskBigDataInitialization extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            // 模态框显示与否
            modalAddInfoVisible: false
        }

        // 表头
        this.columns = [
            {
                title: '主机名称',
                dataIndex: 'taskName',
                key: 'taskName',
                width: 120,
                render: (text) => <span style={{ cursor: 'pointer' }}>{text}</span>
            },
            {
                title: '机房',
                dataIndex: 'roomName',
                key: 'roomName',
                width: 100,
            },
            {
                title: '初始化模板',
                dataIndex: 'dcnIp',
                key: 'dcnIp',
                width: 160,
            },
            {
                title: '状态',
                dataIndex: 'baseTaskStatus',
                key: 'baseTaskStatus',
                width: 100,
                render: (status) => <span style={{
                    color: status === 5 ? '#008364' : '#213555',
                    background: status === 5 ? '#EAF8E5' : '#D2F1FF',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px',
                    lineHeight: '24px',
                    borderRadius: '2px'
                }}>{allStatus[status]}</span>,
            },
            {
                title: '日志',
                dataIndex: 'sn',
                width: 160,
            },
            {
                title: '操作',
                dataIndex: 'op',
                width: '10%',
                render: (d, record) => {
                    return (
                        <Fragment>
                            <button
                                key="btn_1"
                                className="sd-anchor-button"
                                style={{ color: '#0E6EDF' }}
                                onClick={() => this.onDetailShow(record)}
                            >
                                详情
                        </button>
                            {
                                record.status === 10 ? (
                                    <Fragment>
                                        <Divider type="vertical" />
                                        <button
                                            key="btn_2"
                                            className="sd-anchor-button"
                                            style={{ color: '#0E6EDF' }}
                                            onClick={() => this.artificialRestorationProcess(record)}
                                        >
                                            人工修复
                                    </button>
                                    </Fragment>
                                ) : null
                            }
                        </Fragment>
                    )
                }
            },
        ];

        // 绑定事件
        this.toggleModalShow = this.toggleModalShow.bind(this);
    }

    static contextType = Context;

    // 选择模板的模态框显示事件
    toggleModalShow = () => {
        const modalAddInfoVisible = !this.state.modalAddInfoVisible;
        this.setState({ modalAddInfoVisible })
    }

    render() {
        const { hostDataSource, hostDataLoading, automaticBaseTaskId } = this.props;
        return (
            <Fragment>
                <div className="sd-filter-form">
                    <Button htmlType="button"
                        type="primary"
                        className="sd-minor"
                        onClick={this.toggleModalShow}
                    >
                        选择模版
                    </Button>
                    {/*title:弹出框标题  visible:是否可见  onCancel:取消按钮，右上角X号事件*/}
                    <Modal
                        centered
                        className="open-task-list"
                        visible={this.state.modalAddInfoVisible}
                        onCancel={this.toggleModalShow}
                        footer={null}
                    >
                        <SelectTaskModel
                            getList={this.getList}
                            taskId={automaticBaseTaskId}
                            hostId={hostDataSource.length ? hostDataSource[0].automaticHostId : undefined}
                        />
                    </Modal>
                    <Input.Search
                        allowClear
                        placeholder="请输入关键字"
                    // onChange={this.onSearchChange}
                    />
                </div>
                <SDTable
                    rowKey="automaticHostId"
                    loading={hostDataLoading}
                    columns={this.columns}
                    dataSource={hostDataSource}
                    scroll={{ y: 200 }}
                />
            </Fragment>
        )
    }
}

export default reduxMapper(TaskBigDataInitialization);
