/* eslint-env browser */
import { createElement, createRef, Component } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

// telnet commands
const SE = 0xf0; // 240
const NOP = 0xf1; // 241
const DATA_MARK = 0xf2; // 242
const BREAK = 0xf3; // 243
const INTERRUPT_PROCESS = 0xf4; // 244
const ABORT_OUTPUT = 0xf5; // 245
const ARE_YOU_THERE = 0xf6; // 246
const ERASE_CHARACTER = 0xf7; // 247
const ERASE_LINE = 0xf8; // 248
const GO_AHEAD = 0xf9; // 249
const SB = 0xfa; // 250
const WILL = 0xfb; // 251
const WONT = 0xfc; // 252
const DO = 0xfd; // 253
const DONT = 0xfe; // 254
const INTERPRET_AS_COMMAND = 0xff; // 255
// telnet options
const BinaryTransmission = 0x0; // 0
const Echo = 0x1; // 1
const Reconnection = 0x2; // 2
const Suppress_Go_Ahead = 0x3; // 3
const Approx_Message_Size_Negotiation = 0x4; // 4
const Status = 0x5; // 5
const Timing_Mark = 0x6; // 6
const Remote_Controlled_Trans_and_Echo = 0x7; // 7
const Output_Line_Width = 0x8; // 8
const Output_Page_Size = 0x9; // 9
const Output_Carriage_Return_Disposition = 0xa; // 10
const Output_Horizontal_Tab_Stops = 0xb; // 11
const Output_Horizontal_Tab_Disposition = 0xc; // 12
const Output_Formfeed_Disposition = 0xd; // 13
const Output_Vertical_Tabstops = 0xe; // 14
const Output_Vertical_Tab_Disposition = 0xf; // 15
const Output_Linefeed_Disposition = 0x10; // 16
const Extended_ASCII = 0x11; // 17
const Logout = 0x12; // 18
const Byte_Macro = 0x13; // 19
const Data_Entry_Terminal = 0x14; // 20
const SUPDUP = 0x15; // 22
const SUPDUP_Output = 0x16; // 22
const Send_Location = 0x17; // 23
const Terminal_Type = 0x18; // 24
const End_of_Record = 0x19; // 25
const TACACS_User_Identification = 0x1a; // 26
const Output_Marking = 0x1b; // 27
const Terminal_Location_Number = 0x1c; // 28
const Telnet_3270_Regime = 0x1d; // 29
const X3_PAD = 0x1e; // 30
const Negotiate_About_Window_Size = 0x1f; // 31
const Terminal_Speed = 0x20; // 32
const Remote_Flow_Control = 0x21; // 33
const Linemode = 0x22; // 34
const X_Display_Location = 0x23; // 35
const Extended_Options_List = 0xff; // 255

// ansi
const ESC = 0x1b;

/*
-> raw bytes
  -> telnet
    -> ascii (control)
    -> ansi (control)
      -> output
    -> gmcp
    -> mxp
      -> output
    -> mccp
      -> ansi
*/

const telnetMachine = new Map([
  [
    INTERPRET_AS_COMMAND,
    {
      actions: new Map([
        [GO_AHEAD, {}],
        [SB, {}],
        [WILL, {}],
        [WONT, {}],
        [DO, {}],
        [DONT, {}],
      ]),
    },
  ],
  [DONT, {}],
  [DO, {}],
  [WONT, {}],
  [WILL, {}],
  [GO_AHEAD, {}],
  [SE, {}],
]);

// const term = new Terminal();
// term.open(document.getElementById("xterm-container"));

const StreamMachine = {
  //
};
function createMachine() {}
console.log("StreamMachine:", StreamMachine);

const remote = new WebSocket("ws://localhost:8081");
// remote.onclose = () => {
//   console.log("socket closed");
// };
// /** @param {Event} event */
// remote.onerror = (event) => {
//   console.warn("socket err", event);
// };
// remote.onopen = () => {
//   console.log("open");
// };

export class Client extends Component {
  /** @param {any} props */
  constructor(props) {
    super(props);
    this.term = null;
    this.mountRef = createRef();
  }

  /** @override */
  componentDidMount() {
    let buffer = [];
    this.term = new Terminal();
    // this.term.onBell(function onBell(event) {
    //   console.log("onBell", event);
    // });
    // this.term.onBinary(function onBinary(event) {
    //   console.log("onBinary", event);
    // });
    // this.term.onCursorMove(function onCursorMove(event) {
    //   console.log("onCursorMove", event);
    // });
    this.term.onData((event) => {
      const foo = new TextEncoder().encode(event);
      console.log("onData", foo);
      this.term?.write(event);

      // if (handlers.has(this.))
    });
    // this.term.onKey((event) => {
    //   console.log("onKey", event);
    // });
    // this.term.onLineFeed(function onLineFeed(event) {
    //   console.log("onLineFeed", event);
    // });
    // this.term.onRender((event) => {
    //   console.log("onRender", this.term?.buffer.normal);
    // });
    this.term.onResize(function onResize(event) {
      console.log("onResize", event);
    });
    // this.term.onScroll(function onScroll(event) {
    //   console.log("onScroll", event);
    // });
    // this.term.onSelectionChange(function onSelectionChange(event) {
    //   console.log("onSelectionChange", event);
    // });
    // this.term.onTitleChange(function onTitleChange(event) {
    //   console.log("onTitleChange", event);
    // });
    // remote.onmessage = (event) => {
    //   this.term?.write(event.data);
    // };
    const fitAddon = new FitAddon();
    this.term.loadAddon(fitAddon);
    this.term.open(this.mountRef.current);
    fitAddon.fit();
  }
  /** @override */
  componentWillUnmount() {
    this.term?.dispose();
    // remote.close();
  }

  /** @override */
  render() {
    return createElement("div", { id: "clientMount", ref: this.mountRef });
  }
}
