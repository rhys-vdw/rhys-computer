import { NodeType } from './constants/NodeType'
import Random from 'random-js'
import Color from 'tinycolor2'

function times<T>(count: number, cb: (i: number) => T): T[] {
  let result: T[] = []
  for (let i = 0; i < count; i++) {
    result.push(cb(count));
  }
  return result
}

export const MaxMouthCurve = 10;
export const MinMouthCurve = -20;

export interface Node {
  readonly type: NodeType,
  readonly position?: [number, number],
  readonly rotation?: number,
  readonly maxAngle?: number,
  readonly scale?: number,
  readonly size?: [number, number],
  readonly color?: Color.Instance,
  readonly mirror?: boolean,
  readonly children: readonly Node[]
  readonly lipThickness?: number
  readonly curve?: number
  readonly pupilSize?: number
}

type GetColor = () => Color.Instance;

function nestNodes(nodes: readonly Node[]): Node | null {
  for (let i = 0; i < nodes.length - 1; i++) {
    (nodes[i].children as Node[]).push(nodes[i + 1])
  }
  return nodes.length === 0 ? null : nodes[0]
}

function createBallJoint(
  { position, rotation, mirror }: Pick<Node, "position" | "rotation" | "mirror">,
  random: Random,
  nextColor: GetColor
): Node {
  const size = random.real(10, 40);
  return {
    type: NodeType.BallJoint,
    position,
    rotation,
    maxAngle: random.real(5, 90),
    size: [size, size],
    color: nextColor(),
    mirror,
    children: []
  }
}

function generateLimb(
  { rotation, position }: Pick<Node, "position" | "rotation">,
  random: Random,
  nextColor: GetColor
) {
  const count = random.integer(1, 4);
  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push(
      createBallJoint(i === 0
        ? { position, rotation, mirror: true }
        : {
            position: [0, 2],
            rotation: random.real(-20, 70),
            mirror: random.bool(0.2)
          }
      , random, nextColor),
      {
        type: NodeType.Segment,
        size: [
          random.real(10, 20),
          random.real(10, 50)
        ],
        color: nextColor(),
        children: []
      }
    )
  }
  return nestNodes(nodes);
}

function generateHead(random, nextColor): Node {
  const iris: Node = {
    type: NodeType.Iris,
    size: random.real(0.1, 0.7),
    color: randomColor(random),
    pupilSize: random.real(0.1, 0.5),
    children: []
  }

  return {
    type: NodeType.Core,
    position: [0, 2],
    size: [random.real(20, 60), random.real(20, 60)],
    color: nextColor(),
    children: [{
      type: NodeType.Mouth,
      color: randomColor(random),
      size: [random.real(10, 40), random.real(1, 30)],
      lipThickness: random.real(1, 10),
      curve: random.real(MaxMouthCurve, MinMouthCurve),
      position: [0, -random.real(0.1, 0.9)],
      children: []
    }, ...times(random.real(1, 3), (): Node => {
      const isSingle = random.bool(0.5);
      return {
        type: NodeType.Eye,
        scale: random.real(3, 20),
        mirror: !isSingle,
        position: [
          isSingle
            ? 0
            : random.real(0.2, 0.5)
        , random.real(0.3, 1)],
        children: [iris]
      }
    })]
  }
}

function generateNeck(random: Random, nextColor: GetColor): Node {
  const size = random.real(10, 30)
  return {
    type: NodeType.Neck,
    maxAngle: 10,
    position: [0, random.real(-0.8, -1)],
    rotation: 0,
    size: [size, size],
    color: nextColor(),
    mirror: false,
    children: [{
      type: NodeType.Segment,
      position: [0, 0],
      rotation: 180,
      size: [random.real(10, 20), random.real(20, 30)],
      color: nextColor(),
      children: [generateHead(random, nextColor)]
    }]
  }
}

function randomColor(random) {
  return Color.fromRatio({
    h: random.real(0, 1, true),
    s: random.real(0, 1, true),
    l: random.real(0.2, 0.8, true),
    a: 0.95
  })
}
function colorMutator(random) {
  const color = randomColor(random)
  return function nextColor() {
    return color
      .spin(random.real(-30, 30, true))
      .saturate(random.real(-10, 10, true))
      .brighten(random.real(-10, 10, true))
      .clone()
  }
}

function generateSpine(random: Random, nextColor: GetColor) {
  const cores = times(random.integer(1, 5), (index): Node => ({
    type: NodeType.Core,
    size: [random.real(15, 50), random.real(15, 40)],
    position: [0, index === 0 ? 0 : -1],
    color: nextColor(),
    mirror: false,
    children: times(random.real(0, 2), () =>
      generateLimb({
        rotation: random.real(0, 180),
        position: [random.real(0.1, 0.4), random.real(0.6, 1)]
      }, random, nextColor) as Node
    )
  }))

  const last = cores[cores.length - 1];
  (last.children as Node[]).push(generateNeck(random, nextColor));
  return nestNodes(cores);
}

export default function generate(seed: number): Node {
  const random = new Random(Random.engines.mt19937().seed(seed));
  const nextColor = colorMutator(random)
  return generateSpine(random, nextColor) as any
}
