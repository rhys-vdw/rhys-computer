import React, { PureComponent, ReactNode, SVGAttributes } from 'react'
import PropTypes from "prop-types"

import * as NodeType from '../constants/NodeType'
import Vector from 'victor'
import random from '../random'
import { Node } from "../Generation"

function Iris({ node }) {
  const { size, color, pupilSize } = node
  return (
    <g>
      <ellipse
        cx={0} cy={0}
        rx={size} ry={size}
        fill={color.toString()}
      />
      <ellipse
        cx={0} cy={0}
        rx={pupilSize} ry={pupilSize}
        fill='black'
      />
      <ellipse
        cx={-0.1} cy={0.1}
        rx={pupilSize * 0.2} ry={pupilSize * 0.2}
        fill='white'
      />
    </g>
  )
}

function Eye({ node, children }, { isBlinking }) {
  const scaleY = isBlinking ? 0 : 1;
  return (
    <g
      className='Eye'
      style={{
        transform: `scale(1, ${scaleY})`,
        transition: `transform 50 ease-out`
      }}
    >
      <ellipse
        className="eye"
        cx={0} cy={0}
        rx={1} ry={1}
        stroke='rgb(100, 100, 100)'
        strokeWidth={0.3}
        fill='white'
      />
      { children }
    </g>
  )
}

Eye.contextTypes = {
  isBlinking: PropTypes.bool.isRequired,
}

interface BallJointProps {
  readonly node: Node
}

interface BallJointState {
  readonly angle: number
}

class BallJoint extends PureComponent<BallJointProps, BallJointState> {
  state: BallJointState = { angle: 0 }
  intervalId: number = -1

  updateAngle = () => {
    const { maxAngle } = this.props.node;
    const angle = random.integer(0, maxAngle!) - maxAngle! / 2
    this.setState({ angle })
  }

  componentDidMount() {
    this.intervalId = window.setInterval(
      this.updateAngle,
      random.integer(300, 500)
    )
  }

  componentWillUnmount() {
    clearInterval(this.intervalId)
  }

  render() {
    const { node, children } = this.props
    const { size, color } = node
    const { angle } = this.state
    return (
      <g
        className='BallJoint'
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <ellipse
          cx={0} cy={0}
          rx={size![0]} ry={size![1]}
          fill={color!.toString()}
        />
        { children }
      </g>
    )
  }
}

interface SegementProps {
  readonly node: Node,
  readonly children: ReactNode
}

function Segment({ node, children }: SegementProps) {
  const { size, color } = node
  return (
    <g className='Segment'>
      <ellipse
        cx={0} cy={size![1]}
        rx={size![0]} ry={size![1]}
        fill={color!.toString()}
      />
      { children }
    </g>
  )
}

interface MouthProps {
  readonly node: Node,
}

interface MouthState {
  readonly isSucking: boolean
}

class Mouth extends PureComponent<MouthProps, MouthState> {
  state: MouthState = {
    isSucking: false
  }

  private handleMouseOver = () => {
    this.setState({ isSucking: true })
  }

  private handleMouseLeave = () => {
    this.setState({ isSucking: false })
  }

  componentDidMount() {
    this.setState({ isSucking: false })
  }

  render() {
    const { node } = this.props;
    const { size, color, curve } = node;
    const { isSucking } = this.state;

    const halfWidth = size![0] / 2

    return (
      <g className='Mouth'
      >
        { !isSucking && (
          <path
            d={[
              `M ${-halfWidth} 0`,
              `Q 0 ${curve}, ${halfWidth} 0`
            ].join(' ')}
            fill={'transparent'}
            stroke={color!.toString()}
            strokeWidth={node.lipThickness! * 2}
            strokeLinecap="round"
          />
        ) }
        { isSucking && (
          <ellipse
            cx={0} cy={0}
            rx={Math.max(15, halfWidth)}
            ry={Math.max(15, halfWidth)}
            fill='black'
            stroke={color!.toString()}
            strokeWidth={node.lipThickness}
          />
        ) }
        <ellipse
          cx={0} cy={0}
          rx={30}
          ry={30}
          fill='transparent'
          strokeWidth={0}
          onMouseOver={this.handleMouseOver}
          onMouseLeave={this.handleMouseLeave}
        />
      </g>
    )
  }

  /*
      <rect
        x={-size[0] / 2} y={-size[1] / 2}
        width={size[0]} height={size[1]}
        fill={'black'}
        stroke={color}
        strokeWidth={node.lipThickness}
        rx={node.borderRadiusX}
        ry={node.borderRadiusY}
      />
      */
}

function Core({ node, children }) {
  const { size, color } = node
  return (
    <g className='Core'>
      <ellipse
        cx={0} cy={0}
        rx={size[0]} ry={size[1]}
        fill={color}
      />
      { children }
    </g>
  )
}

const componentByType = {
  [NodeType.NodeType.Core]: Core,
  [NodeType.NodeType.Neck]: BallJoint,
  [NodeType.NodeType.BallJoint]: BallJoint,
  [NodeType.NodeType.Segment]: Segment,
  [NodeType.NodeType.Mouth]: Mouth,
  [NodeType.NodeType.Eye]: Eye,
  [NodeType.NodeType.Iris]: Iris,
}

function groupTransform(parent: Node, node: Node, isMirrored: boolean): string {
  const mirrorSign = isMirrored ? -1 : 1
  const rotation = node.rotation || 0
  const position = node.position || [0, 0]
  const scale = node.scale || 1

  const translationScale = Vector.fromArray(Array.isArray(parent.size)
    ? parent.size
    : [parent.size, parent.size])

  const translation = new Vector(0, position[1])
    .rotateDeg(position[0] * 180)
    .multiply(translationScale)

  return [
    `scale(${mirrorSign}, 1)`,
    `translate(${translation.x}px, ${translation.y}px)`,
    `rotate(${rotation}deg)`,
    `scale(${scale})`
  ].join(' ')
}

interface NodeProps {
  readonly node: Node,
  readonly parent: Node,
  readonly isMirrored?: boolean,
}

function NodeView({ node, parent, isMirrored = false }: NodeProps) {
  const NodeComponent = componentByType[node.type]

  if (NodeComponent == null) {
    console.error(`Unexpected node type: ${node.type}`)
    return null
  }

  const counts = {};

  const children = node.children.reduce((result, childNode) => {

    // Increment count
    counts[childNode.type] = (counts[childNode.type] || 0) + 1;

    const key = childNode.type + counts[childNode.type]

    result.push(
      <NodeView key={key} parent={node} node={childNode} />
    )
    if (childNode.mirror) result.push(
      <NodeView
        key={`${key}-mirrored`}
        parent={node}
        node={childNode}
        isMirrored={true}
      />
    )
    return result
  }, [] as ReactNode[])

  return (
    <g
      className={node.type}
      style={{ transform: groupTransform(parent, node, isMirrored) }}
    >
      <NodeComponent node={node}>
        { children }
      </NodeComponent>
    </g>
  )
}

const DEFAULT_PARENT: Node = {
  size: [1, 1],
  rotation: 0,
} as any

interface State {
  readonly isBlinking: boolean
}

interface Props extends SVGAttributes<SVGElement> {
  readonly creature: any
}

export default class Creature extends PureComponent<Props, State> {
  public static childContextTypes = {
    isBlinking: PropTypes.bool.isRequired,
  }

  timeoutId: number = -1

  constructor(props) {
    super(props)
    this.state = { isBlinking: false }
    this.updateBlink = this.updateBlink.bind(this)
  }

  updateBlink() {
    const { isBlinking } = this.state;
    this.setState({ isBlinking: !isBlinking })

    const duration = isBlinking
      ? random.integer(500, 5000)
      : random.integer(200, 300)

    this.timeoutId = window.setTimeout(this.updateBlink, duration)
  }

  componentDidMount() {
    this.updateBlink()
  }

  componentWillUnmount() {
    clearTimeout(this.timeoutId)
  }

  getChildContext() {
    const { isBlinking } = this.state
    return { isBlinking }
  }

  render() {
    const { creature, ...rest } = this.props;
    return (
      <svg
        viewBox={`-300 -300 600 500`}
        {...rest}
      >
        <NodeView node={creature} parent={DEFAULT_PARENT} />
      </svg>
    )
  }
}