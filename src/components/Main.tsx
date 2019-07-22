import React, { PureComponent, ReactNode } from "react";
import generateCreature from "../Generation";
import Creature from "./Creature";
import random from "../random";
import CopyToClipboard from "react-copy-to-clipboard";
import Color from "tinycolor2";

const nextSeed = () => random.integer(0, Math.pow(2, 31));
const getHash = () => window.location.hash.substr(1);

function maxLuminence(color: Color.Instance, max: number): Color.Instance {
  const hsv = color.toHsv();
  hsv.v = Math.min(hsv.v, max);
  return Color(hsv);
}

function setTitle(creature) {
  const isBright = creature.color.getBrightness() > 128;
  document.title = isBright ? "☺" : "☻";
}

function updateWindow(seed, creature) {
  window.location.hash = seed;
  setTitle(creature);
}

interface SocialProps {
  icon: string;
  children?: ReactNode;
  href: string;
}

const Social = ({ icon, children, href }: SocialProps) => (
  <a href={href}>
    <i className={`fa fa-${icon}`} aria-hidden="true" />
    {children}
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
    this.handleClick = this.handleClick.bind(this);
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handleCopy = this.handleCopy.bind(this);
  }

  componentDidMount() {
    window.onhashchange = this.handleHashChange;
  }

  componentWillUnmount() {
    window.onhashchange = null;
  }

  handleHashChange() {
    this.setSeed(parseInt(getHash(), 10));
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

  handleClick() {
    this.setSeed(nextSeed());
  }

  handleCopy() {
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
          Rhys van der Waerden — game and web developer
          <br />
          <Social icon="github" href="https://github.com/rhys-vdw">
            GitHub
          </Social>{" "}
          &bull;{" "}
          <Social
            icon="linkedin-square"
            href="https://www.linkedin.com/in/rhys-van-der-waerden-5b857454/"
          >
            LinkedIn
          </Social>
        </div>
      </div>
    );
  }
}
