// 装机任务
import React, { Component } from 'react';
import { Button, Input, message, Modal, Avatar, Progress, Icon } from 'antd';
import moment from 'moment';

import SDTable from 'src/components/SDTable';

import api from "src/tools/api";
import TaskInfo from './TaskInfo';
import { reduxMapper } from "src/redux/modules/installManager";


// 0未装机，1已装机，2正在装机，3装机异常
const allStatus = ['未装机', '已装机', '正在装机', '装机异常', '人工修复(已装机)'];

class TaskList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedRowKeys: [],
            tableLoading: true,
            dataSource: [],
            scrollY: undefined,
            currentObj: {
                obj: {},
                fields: {},
            },
            installResult: [],
            modalVisible: false,
            modalAddInfoVisible: false,
            detailDataSource: {
                success: [],
                failed: [],
            },
            baseTaskStatus: -1,
        };

        // 表头内容
        this.columns = [
            {
                title: '任务名称',
                dataIndex: 'baseTaskName',
                key: 'baseTaskName',
                width: 120,
            },
            {
                title: '创建人',
                dataIndex: 'createUserName',
                key: 'createUserName',
                width: 80,
                render: () => <span>admin</span>
            },
            {
                title: '开始时间',
                dataIndex: 'createTime',
                key: 'createTime',
                width: 160,
                render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
            },
            {
                title: '主机个数',
                dataIndex: 'baseTaskHostTotal',
                key: 'baseTaskHostTotal',
                width: 100,
                onCell: (record, index) => {
                    return {
                        style: {
                            textAlign: 'center',
                            paddingRight: 45,
                        }
                    }
                },
                render: (totalTaskPoint) => <span>{totalTaskPoint}</span>
            },
            {
                title: '状态',
                dataIndex: 'baseTaskStatus',
                key: 'baseTaskStatus',
                width: 140,
                render: (status) => <span style={{
                    color: status === 5 ? '#008364' : '#213555',
                    background: status === 5 ? '#EAF8E5' : '#D2F1FF',
                    display: 'inline-block',
                    padding: '4px 8px',
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: '2px'
                }}>{allStatus[status]}</span>,
            },
            {
                title: '提示',
                key: 'op',
                width: 100,
                render: (automaticBaseTaskId) => <div>{automaticBaseTaskId.index % 2 === 0
                    ? <Icon type="warning" theme="filled" style={{ color: '#f4c022' }} />
                    : <Icon type="pause-circle" theme="filled" style={{ color: '#686f7a' }} />
                }
                </div>
            },
            {
                title: '处理进度',
                dataIndex: 'speedOfProgress',
                key: 'speedOfProgress',
                width: 120,
                sorter: (a, b) => parseInt(a.speedOfProgress * 100) - parseInt(b.speedOfProgress * 100),
                render(speedOfProgress) {
                    const percent = parseInt(speedOfProgress * 100);
                    return (
                        <Progress percent={percent} strokeColor="#22C151" />
                    );
                },
            },
        ];

        // 绑定事件
        this.toggleModalAddInfo = this.toggleModalAddInfo.bind(this);
    }

    componentDidMount() {
        this.getList();
    };

    // 获取装机任务列表数据
    getList = (options = {}) => {
        this.setState({ tableLoading: true }, () => {
            api.getAllBaseTask(options).then(res => {
                if (res.data.success !== 'true') {
                    this.setState({ tableLoading: false });
                    message.error(res.data.msg);
                    return;
                }
                this.setState({
                    tableLoading: false,
                    dataSource: res.data.data && res.data.data.map((d, i) => ({ ...d, index: i + 1 })),
                });
            }).catch(() => {
                this.setState({ tableLoading: false });
            });
        });

    };

    // 计算scrollY的高度
    getScrollY = () => {
        const contentPadding = 16;
        const contentTabs = 61;
        const contentFilterForm = 37;
        const contentTablePagination = 44;
        const contentTableHead = 64; // 当表格内容占两行时的高度, 43: 一行的高度
        return contentPadding + contentTabs + contentFilterForm + contentTablePagination + contentTableHead;
    };

    // 【创建装机任务】弹框的显示事件
    toggleModalAddInfo = () => {
        const modalAddInfoVisible = !this.state.modalAddInfoVisible;
        this.setState({ modalAddInfoVisible })
    }

    // 
    changeModalList = (a) => {
        this.setState({
            modalAddInfoVisible: a
        })
    }

    /** 点击任一装机任务，相应切换下屏的内容
     *  @param {object} row: 表格行的数据集合
     */
    handleClickRow = (row) => {
        return {
            onClick: () => {
                this.props.changeTaskId(row.automaticBaseTaskId);
            }
        };
    }

    render() {
        const { modalAddInfoVisible, tableLoading, dataSource } = this.state;
        return (
            <div>
                <div className="sd-filter-form">
                    <Button
                        htmlType="button"
                        type="primary"
                        className="sd-minor"
                        onClick={this.toggleModalAddInfo}
                    >
                        创建任务
                    </Button>

                    <Modal
                        centered
                        destroyOnClose
                        footer={null}
                        width={800}
                        className="open-task-list"
                        visible={modalAddInfoVisible}
                        onCancel={this.toggleModalAddInfo}
                    >
                        <TaskInfo
                            getList={this.getList}
                            changeModalList={this.changeModalList}
                        />
                    </Modal>

                    <Icon
                        type="warning"
                        theme="filled"
                        style={{ color: '#f4c022' }}
                        className="icon-name"
                    />
                    <span className="span-task-style">待处理</span>
                    <Icon
                        type="pause-circle"
                        theme="filled"
                        style={{ color: '#686f7a' }}
                        className="icon-name"
                    />
                    <span className="span-task-style">暂停中</span>
                    <Input.Search
                        allowClear
                        placeholder="请输入名称或描述"
                    // onChange={this.onSearchChange}
                    />
                </div>
                <SDTable
                    // 点击行
                    onRow={(record) => this.handleClickRow(record)}
                    className="task-table-wrapper"
                    rowKey="automaticBaseTaskId"
                    columns={this.columns}
                    loading={tableLoading}
                    dataSource={dataSource}
                    scroll={{ x: true, occupiedHeight: this.getScrollY() }}
                />
            </div>
        )
    }
}

export default reduxMapper(TaskList);
// export default  withRouter(reduxMapper(TaskList));