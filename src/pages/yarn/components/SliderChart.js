import React from 'react';
import echarts from 'echarts';
import update from "immutability-helper";
import _ from 'lodash';
import { computedStyle, getNumber } from "../../../tools/utils";
import './echarts.scss';

let resizeWidth = 8;

export default class SliderChart extends React.Component {
    leftPercent;
    rightPercent;

    //判断鼠标是否按下
    isDown = false;
    // 记录当前鼠标按下时的Dom的id
    movingId = '';

    //实时监听鼠标位置
    currentX = 0;
    //记录鼠标按下瞬间的位置
    mouseX = 0;
    //鼠标按下时移动的偏移量
    offsetX = 0;

    state = {
        startTime: '',
        endTime: '',
    };

    componentDidMount() {
        this.chartEL = document.getElementById(this.props.id);
        this.customZoom = document.getElementById('customZoom' + this.props.id);
        this.slideBlock = document.getElementById('slideBlock' + this.props.id);
        this.resizeLeft = document.getElementById('resizeLeft' + this.props.id);
        this.resizeRight = document.getElementById('resizeRight' + this.props.id);
        this.resizeLeftDate = document.getElementById('resizeLeftDate' + this.props.id);
        this.resizeRightDate = document.getElementById('resizeRightDate' + this.props.id);

        this.chart = echarts.init(this.chartEL);
        this.chart.setOption(this.props.options || {});
        this.setMarkArea();

        window.addEventListener('resize', this.resizeWindowListener);

        // 鼠标按下方块
        this.resizeLeft.addEventListener("touchstart", this.start);
        this.resizeLeft.addEventListener("mousedown", this.start);
        this.slideBlock.addEventListener("touchstart", this.start);
        this.slideBlock.addEventListener("mousedown", this.start);
        this.resizeRight.addEventListener("touchstart", this.start);
        this.resizeRight.addEventListener("mousedown", this.start);
        // 拖动
        window.addEventListener("touchmove", this.moving);
        window.addEventListener("mousemove", this.moving);
        // 鼠标松开
        window.addEventListener("touchend", this.end);
        window.addEventListener("mouseup", this.end);
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(nextProps.sliderParam, this.props.sliderParam);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeWindowListener);

        // 鼠标按下方块
        this.resizeLeft.removeEventListener("touchstart", this.start);
        this.resizeLeft.removeEventListener("mousedown", this.start);
        this.slideBlock.removeEventListener("touchstart", this.start);
        this.slideBlock.removeEventListener("mousedown", this.start);
        this.resizeRight.removeEventListener("touchstart", this.start);
        this.resizeRight.removeEventListener("mousedown", this.start);
        // 拖动
        window.removeEventListener("touchmove", this.moving);
        window.removeEventListener("mousemove", this.moving);
        // 鼠标松开
        window.removeEventListener("touchend", this.end);
        window.removeEventListener("mouseup", this.end);
    }

    resizeWindowListener = () => {
        this.chart.resize();
        this.setMarkArea();
    };

    // 获取滑块位置, 设置areaMark
    setMarkArea = (newChartOption) => {
        const wrapperWidth = this.chartEL.clientWidth;
        const customZoomWidth = this.customZoom.clientWidth;
        // 滑块部分(custom-zoom)与echarts有相对位置调整
        // 获取左边偏移量(可理解为计算padding-left)
        const padding = getNumber(computedStyle(this.customZoom).left) - Math.abs(getNumber(computedStyle(this.customZoom).marginLeft)) || 0;
        const left = getNumber(computedStyle(this.slideBlock).left) || 0;
        const blockWidth = this.slideBlock.clientWidth;
        const right = blockWidth + left;
        const leftPercent = (padding + left) / wrapperWidth;
        const rightPercent = (padding + right) / wrapperWidth;
        this.leftPercent = left / customZoomWidth;
        this.rightPercent = right / customZoomWidth;
        this.chart.setOption(update(newChartOption || this.props.options || {}, {
            series: {
                0: {
                    markArea: {
                        data: {
                            $set: [
                                [{
                                    x: leftPercent * 100 + '%',
                                }, {
                                    x: rightPercent * 100 + '%',
                                },]
                            ]
                        }
                    }
                }
            }
        }));
    };

    // 左边滑块移动事件回调
    leftBlock = (offsetX, id) => {
        const computed = computedStyle(this.slideBlock);
        const newWidth = getNumber(computed.width) - offsetX;
        if (!computed || id !== this.resizeLeft.id || newWidth <= resizeWidth) return;
        const left = getNumber(computed.left) || 0;
        const newLeft = left + offsetX;
        if (newLeft < 0) return;
        // 控制left以resize
        this.slideBlock.style.left = newLeft + "px";
        const offsetLeft = getNumber(computedStyle(this.resizeLeftDate).left) - offsetX;
        console.log(newWidth, offsetLeft)
        // 调整日期显示位置,不能与结束日期重叠
        // if (newWidth < 100) {
        //     const offsetLeft = getNumber(computedStyle(this.resizeLeftDate).left) - offsetX;
        //     this.resizeLeftDate.style.left = offsetLeft + 'px';
        // } else {
        //     this.resizeLeftDate.style.left = '-35px';
        // }
        this.setMarkArea();
    };

    // 中间滑块移动事件回调
    centerBlock = (offsetX, id) => {
        const computed = computedStyle(this.slideBlock);
        if (!computed || id !== this.slideBlock.id || getNumber(computed.width) <= resizeWidth) return;
        const left = getNumber(computed.left) || 0;
        const right = getNumber(computed.right) || 0;
        const newLeft = left + offsetX;
        const newRight = right - offsetX;
        this.slideBlock.style.left = newLeft + "px";
        this.slideBlock.style.right = newRight + "px";
        if (newLeft < 0 || newRight < 0) {
            this.slideBlock.style.left = left + "px";
            this.slideBlock.style.right = right + "px";
            return;
        }
        this.setMarkArea();
    };

    // 右边滑块移动事件回调
    rightBlock = (offsetX, id) => {
        const computed = computedStyle(this.slideBlock);
        const newWidth = getNumber(computed.width) + offsetX;
        // 如果滑块的长度小于最小长度则返回
        if (!computed || id !== this.resizeRight.id || newWidth <= resizeWidth) return;
        const right = getNumber(computed.right) || 0;
        const newRight = right - offsetX;
        if (newRight < 0) return;
        this.slideBlock.style.right = newRight + "px";
        // 调整日期显示位置,不能与开始日期重叠
        if (newWidth < 100) {
            const offsetLeft = getNumber(computedStyle(this.resizeRightDate).left) - offsetX;
            this.resizeRightDate.style.left = offsetLeft + 'px';
        } else {
            this.resizeRightDate.style.left = '-35px';
        }
        this.setMarkArea();
    };

    // 鼠标移动事件
    moving = (event) => {
        event = event ? event : window.event;
        event.cancelBubble = true;
        event.stopPropagation();
        if (this.isDown) {
            this.currentX = event.clientX;
            this.offsetX = this.currentX - this.mouseX;   //计算鼠标移动偏移量
            if (this.movingId === this.resizeLeft.id) {
                this.leftBlock(this.offsetX, this.movingId);
            } else if (this.movingId === this.slideBlock.id) {
                this.centerBlock(this.offsetX, this.movingId);
            } else {
                this.rightBlock(this.offsetX, this.movingId);
            }
            this.mouseX = event.clientX;
        }
    };

    // 鼠标点下事件
    start = (event) => {
        this.isDown = true;
        this.mouseX = event.clientX;
        this.movingId = event.target.id;
    };

    // 鼠标松开事件
    end = () => {
        this.isDown && this.props.sliderEvent && this.props.sliderEvent(this.leftPercent, this.rightPercent);
        this.isDown = false;
        this.offsetX = 0;
        this.movingId = '';
    };

    /***
     * 设置滑块位置
     * @param startPosition %
     * @param endPosition %
     * @param startTime
     * @param endTime
     * @param newChartOption
     */
    setSlider = ({ startPosition, endPosition, startTime, endTime }, newChartOption) => {
        this.slideBlock.style.left = startPosition + '%';
        this.slideBlock.style.right = (100 - endPosition) + "%";
        this.setMarkArea(newChartOption);
        this.setState({ startTime, endTime });
    };

    render() {
        const id = this.props.id;
        return (<div className="chart-wrapper" id={"chart-wrapper" + id}>
            <div id={id} className="chart"/>
            <div className="custom-zoom" id={"customZoom" + id}>
                <div className="slide-block" id={"slideBlock" + id}>
                    <span className="resize-left" id={"resizeLeft" + id}>
                        <span className="date" id={"resizeLeftDate" + id}>{this.state.startTime}</span>
                    </span>
                    <span className="resize-right" id={"resizeRight" + id}>
                        <span className="date" id={"resizeRightDate" + id}>{this.state.endTime}</span>
                    </span>
                </div>
            </div>
        </div>)
    }
}