import React, { Fragment } from 'react';
import SDTable from 'src/components/SDTable';
import { Input, Button, Modal } from "antd";
import { reduxMapper } from "src/redux/modules/diskTrouble";
import Context from "./Context";
import ClusterConfigurationPopUp from './ClusterConfigurationPopUp'
import { debounce } from "src/tools/utils";
// import { getStatus } from "src/pages/diskTrouble/List/commonStatus";

// 0未装机，1已装机，2正在装机，3装机异常
const allStatus = ['未装机', '已装机', '正在装机', '装机异常', '人工修复（已装机）'];

class TaskClusterConfiguration extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dataSource: [],
            selectedRowKeys: [],
            tableLoading: true,
            scrollY: undefined,
            automaticBaseTaskId: '',
        };
    }

    static contextType = Context;

    columns = [
        {
            title: '序列号',
            dataIndex: 'cobblerHostSn ',
            key: 'cobblerHostSn ',
            width: 60,
            render(text) {
                return (
                    <span style={{ cursor: 'pointer' }}>{text}</span>
                )
            }
        },
        {
            title: 'mac地址',
            dataIndex: 'mac',
            key: 'mac',
            width: 80,
        },
        {
            title: '机房',
            dataIndex: 'roomName',
            key: 'roomName',
            width: 100,
        },
        {
            title: '操作系统',
            dataIndex: 'sysVersion ',
            key: 'sysVersion ',
            width: 80,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
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
    ];

    componentWillReceiveProps(nextProps, nextContext) {
        // 从"未完成任务"获取automaticBaseTaskId
        if (nextProps.automaticBaseTaskId !== this.state.automaticBaseTaskId) {
            this.getList(nextProps.automaticBaseTaskId);
        }
        // websocket 更新
        if (nextProps.websocketMsg) {
            debounce(() => this.getList(nextProps.automaticBaseTaskId));
        }
    }
    componentDidMount() {
    }

    openModalAddInfo = (type) => {
        this.setState({ modalAddInfoVisible: true })
    }
    
    render() {
        const state = this.state;
        return (
            <Fragment>
                <div className="sd-filter-form">
                    <Button htmlType="button"
                        type="primary"
                        className="sd-minor"
                        onClick={() => this.openModalAddInfo("modalAddInfo")}
                    >
                        集群配置
                    </Button>
                    {/*title:弹出框标题  visible:是否可见  onCancel:取消按钮，右上角X号事件*/}
                    <Modal
                        title='选择模版'
                        className="select-task-list"
                        visible={this.state.modalAddInfoVisible}
                        onCancel={() => {
                            this.setState({ modalAddInfoVisible: false })
                        }}
                        footer={null}
                    >
                        <ClusterConfigurationPopUp getList={this.getList} changeModalList={this.changeModalList} />
                    </Modal>
                    <div style={{ float: 'right', margin: '-10px 20px 10px 0', }}>
                        <Input.Search
                            placeholder="请输入关键字"
                            style={{ width: 252 }}
                            onChange={e => this.handleSearch(e.target.value)}
                        />
                    </div>
                </div>
                <SDTable
                    rowKey="id"
                    id="testclick"
                    columns={this.columns}
                    dataSource={state.dataSource}
                    scroll={{ y: 200 }}
                />
            </Fragment>
        )
    }
}
export default reduxMapper(TaskClusterConfiguration);