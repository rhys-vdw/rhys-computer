import React, { PureComponent } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import Color from "tinycolor2";
import generateCreature, { Node, MinMouthCurve, MaxMouthCurve } from "../Generation";
import random from "../random";
import Creature from "./Creature";
import { NodeType } from "../constants/NodeType";

const nextSeed = () => random.integer(0, Math.pow(2, 31));
const getHash = () => window.location.hash.substr(1);

function maxLuminence(color: Color.Instance, max: number): Color.Instance {
  const hsv = color.toHsv();
  hsv.v = Math.min(hsv.v, max);
  return Color(hsv);
}

const SmilingFace = "😊";
const SlightlySmilingFace = "🙂";
const NeutralFace = "😐";
const SlightlyFrowningFace = "🙁";
const FrowningFace = "☹️";

function setTitle(creature: Node) {
  const mouth = findMouth(creature)!
  const curve = mouth.curve || 0;
  let title: string;
  if (curve > 0.6 * MaxMouthCurve) title = FrowningFace;
  else if (curve > 0.2 * MaxMouthCurve) title = SlightlyFrowningFace;
  else if (curve > 0.05 * MinMouthCurve) title = NeutralFace;
  else if (curve > 0.6 * MinMouthCurve) title = SlightlySmilingFace;
  else title = SmilingFace;
  document.title = title;
}

function findMouth(node: Node): Node | null {
  if (node.type === NodeType.Mouth) {
    return node
  }
  for (const child of node.children) {
    const mouth = findMouth(child)
    if (mouth !== null) return mouth
  }
  return null
}

function updateWindow(seed: number, creature: Node) {
  window.location.hash = seed.toString();
  setTitle(creature);
}

interface SocialProps {
  readonly icon: string;
  readonly children?: string;
  readonly href: string;
}

const Social = ({ icon, children, href }: SocialProps) => (
  <a className="Social" href={href} title={children}>
    <i className={`Social-icon ${icon}`} aria-hidden="true" />
    <span className="Social-text">
      {children}
    </span>
  </a>
);

interface State {
  readonly creature: any;
  readonly seed: number;
  readonly hasBeenShared: boolean;
}

export default class Main extends PureComponent<{}, State> {
  constructor(props) {
    super(props);
    const hash = getHash();
    const seed = hash.length === 0 ? nextSeed() : parseInt(hash, 10);
    const creature = generateCreature(seed);
    updateWindow(seed, creature);
    this.state = { creature, seed, hasBeenShared: false };
  }

  componentDidMount() {
    window.onhashchange = this.handleHashChange;
  }

  componentWillUnmount() {
    window.onhashchange = null;
  }

  setSeed(seed: number) {
    const creature = generateCreature(seed);
    updateWindow(seed, creature);
    this.setState({
      creature,
      seed,
      hasBeenShared: false
    });
  }

  private handleHashChange = () => {
    this.setSeed(parseInt(getHash(), 10));
  }

  private handleClick = () => {
    this.setSeed(nextSeed());
  }

  private handleCopy = () => {
    this.setState({ hasBeenShared: true });
  }

  render() {
    const { hasBeenShared, creature, seed } = this.state;
    const textColor = maxLuminence(creature.color, 0.9);
    const hoverColor = textColor.clone().darken(30);
    const textHex = textColor.toString("hex8");
    const hoverHex = hoverColor.toString("hex8");
    return (
      <div className="Main" style={{ color: textHex }}>
        <style
          dangerouslySetInnerHTML={{
            __html: `a:hover { color: ${hoverHex} !important }`
          }}
        />
        <CopyToClipboard
          text={window.location.toString()}
          onCopy={this.handleCopy}
        >
          <a className="Main-saveLink" href={`#${seed}`}>
            {hasBeenShared ? (
              <span className="Main-copied">♡ copied to clipboard ♡</span>
            ) : (
              <span className="Main-share">share</span>
            )}
          </a>
        </CopyToClipboard>
        <Creature
          className="Main-creature"
          creature={creature}
          onClick={this.handleClick}
        />
        <div className="Main-contact">
          <p>
          Rhys van der Waerden — game and web developer
          </p><p>
          <Social icon="fas fa-envelope" href="mailto:https://github.com/rhys-vdw">
            rhys.vdw@gmail.com
          </Social>
          <Social icon="fab fa-github" href="https://github.com/rhys-vdw">
            GitHub
          </Social>
          <Social
            icon="fab fa-linkedin"
            href="https://www.linkedin.com/in/rhys-van-der-waerden-5b857454/"
          >
            LinkedIn
          </Social>
          <Social
            icon="fab fa-twitter-square"
            href="https://www.linkedin.com/in/rhys-van-der-waerden-5b857454/"
          >
            Twitter
          </Social>
          </p>
        </div>
      </div>
    );
  }
}
