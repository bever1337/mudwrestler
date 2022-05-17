/* eslint-env node */
import { Duplex } from "node:stream";
import { nfaFactory } from "../app/machine/index.js";

// telnet commands
const TelnetCommands = {
  SUBNEGOTIATION_END: 0xf0, // 240
  NOP: 0xf1, // 241
  DATA_MARK: 0xf2, // 242
  BREAK: 0xf3, // 243
  INTERRUPT_PROCESS: 0xf4, // 244
  ABORT_OUTPUT: 0xf5, // 245
  ARE_YOU_THERE: 0xf6, // 246
  ERASE_CHARACTER: 0xf7, // 247
  ERASE_LINE: 0xf8, // 248
  GO_AHEAD: 0xf9, // 249
  SUBNEGOTIATION_BEGIN: 0xfa, // 250
  WILL: 0xfb, // 251
  WONT: 0xfc, // 252
  DO: 0xfd, // 253
  DONT: 0xfe, // 254
  INTERPRET_AS_COMMAND: 0xff, // 255
};

// telnet options
const TelnetOptions = {
  // telnet options
  BINARY_TRANSMISSION: 0x0, // 0
  // ECHO: 0x1, // 1
  // RECONNECTION: 0x2, // 2
  // SUPPRESS_GO_AHEAD: 0x3, // 3
  // APPROX_MESSAGE_SIZE_NEGOTIATION: 0x4, // 4
  // STATUS: 0x5, // 5
  // TIMING_MARK: 0x6, // 6
  // REMOTE_CONTROLLED_TRANS_AND_ECHO: 0x7, // 7
  // OUTPUT_LINE_WIDTH: 0x8, // 8
  // OUTPUT_PAGE_SIZE: 0x9, // 9
  // OUTPUT_CARRIAGE_RETURN_DISPOSITION: 0xa, // 10
  // OUTPUT_HORIZONTAL_TAB_STOPS: 0xb, // 11
  // OUTPUT_HORIZONTAL_TAB_DISPOSITION: 0xc, // 12
  // OUTPUT_FORMFEED_DISPOSITION: 0xd, // 13
  // OUTPUT_VERTICAL_TABSTOPS: 0xe, // 14
  // OUTPUT_VERTICAL_TAB_DISPOSITION: 0xf, // 15
  // OUTPUT_LINEFEED_DISPOSITION: 0x10, // 16
  // EXTENDED_ASCII: 0x11, // 17
  // LOGOUT: 0x12, // 18
  // BYTE_MACRO: 0x13, // 19
  // DATA_ENTRY_TERMINAL: 0x14, // 20
  // SUPDUP: 0x15, // 22
  // SUPDUP_OUTPUT: 0x16, // 22
  // SEND_LOCATION: 0x17, // 23
  // TERMINAL_TYPE: 0x18, // 24
  // END_OF_RECORD: 0x19, // 25
  // TACACS_USER_IDENTIFICATION: 0x1a, // 26
  // OUTPUT_MARKING: 0x1b, // 27
  // TERMINAL_LOCATION_NUMBER: 0x1c, // 28
  // TELNET_3270_REGIME: 0x1d, // 29
  // X3_PAD: 0x1e, // 30
  // NEGOTIATE_ABOUT_WINDOW_SIZE: 0x1f, // 31
  // TERMINAL_SPEED: 0x20, // 32
  // REMOTE_FLOW_CONTROL: 0x21, // 33
  // LINEMODE: 0x22, // 34
  // X_DISPLAY_LOCATION: 0x23, // 35
  // ENVIRONMENT_OPTION: 0x24, // 36
  // AUTHENTICATION_OPTION: 0x25, // 37
  // ENCRYPTION_OPTION: 0x26, // 38
  // NEW_ENVIRONMENT_OPTION: 0x27, // 39
  // TN3270E: 0x28, // 40
  // XAUTH: 0x29, // 41
  // CHARSET: 0x30, // 42
  // TELNET_REMOTE_SERIAL_PORT: 0x31, // 43
  // COM_PORT_CONTROL_OPTION: 0x32, // 44
  // TELNET_SUPPRESS_LOCAL_ECHO: 0x33, // 45
  // TELNET_START_TLS: 0x34, // 46
  // KERMIT: 0x35, // 47
  // SEND_URL: 0x36, // 48
  // FORWARD_X: 0x37, // 49
  // // unassigned
  // TELOPT_PRAGMA_LOGON: 0x8a, // 138
  // TELOPT_SSPI_LOGON: 0x8b, // 139
  // TELOPT_PRAGMA_HEARTBEAT: 0x8c, // 140
  // // unassigned
  // EXTENDED_OPTIONS_LIST: 0xff, // 255
};

// ansi
const ESC = 0x1b;

const OptionTransitions = {
  OFFER_NEGATIVE: "offer negative",
  OFFER_POSITIVE: "offer positive",
  REQUEST_NEGATIVE: "request negative",
  REQUEST_POSITIVE: "request positive",
};

const OptionStates = {
  NO: "no",
  WANT_NO: "want no",
  WANT_NO_OPPOSITE: "want no opposite",
  WANT_YES: "want yes",
  WANT_YES_OPPOSITE: "want yes opposite",
  YES: "yes",
};

const TelnetStates = {
  DATA: "data",
  INTERPRETING_COMMAND: "interpreting command",
  // INTERPRETING_OPTION: "interpreting option",
  INTERPRETING_SUBNEGOTIATION_BEGIN: "interpreting subnegotiation",
  INTERPRETING_SUBNEGOTIATION_END: "interpreting subnegotiation end",
  ...OptionTransitions,
};

/** @type {Map<typeof OptionStates[keyof OptionStates], (transition: typeof OptionTransitions[keyof OptionTransitions]) => typeof OptionStates[keyof OptionStates]>} */
const telnetOptionStates = new Map()
  .set(OptionStates.NO, (transition) => {
    switch (transition) {
      case OptionTransitions.OFFER_NEGATIVE:
        // ignored
        return OptionStates.NO;
      case OptionTransitions.OFFER_POSITIVE: {
        // send DO/WILL for yes transition
        // send DONT/WONT for no transition
        const choice = OptionStates.YES || OptionStates.NO;
        return choice;
      }
      case OptionTransitions.REQUEST_NEGATIVE:
        // error
        return OptionStates.NO;
      case OptionTransitions.REQUEST_POSITIVE:
        // send DO/WILL
        return OptionStates.WANT_YES;
      default:
        return undefined;
    }
  })
  .set(OptionStates.WANT_NO, (transition) => {
    switch (transition) {
      case OptionTransitions.OFFER_NEGATIVE:
        return OptionStates.NO;
      case OptionTransitions.OFFER_POSITIVE:
        // error
        return OptionStates.NO;
      case OptionTransitions.REQUEST_NEGATIVE:
        // error
        return OptionStates.WANT_NO;
      case OptionTransitions.REQUEST_POSITIVE:
        return OptionStates.WANT_NO_OPPOSITE;
      default:
        return undefined;
    }
  })
  .set(OptionStates.WANT_NO_OPPOSITE, (transition) => {
    switch (transition) {
      case OptionTransitions.OFFER_NEGATIVE:
        // send DO/WILL
        return OptionStates.WANT_YES;
      case OptionTransitions.OFFER_POSITIVE:
        // error
        return OptionStates.YES;
      case OptionTransitions.REQUEST_NEGATIVE:
        return OptionStates.WANT_NO;
      case OptionTransitions.REQUEST_POSITIVE:
        // error
        return OptionStates.WANT_NO_OPPOSITE;
      default:
        return undefined;
    }
  })
  .set(OptionStates.WANT_YES, (transition) => {
    switch (transition) {
      case OptionTransitions.OFFER_NEGATIVE:
        return OptionStates.NO;
      case OptionTransitions.OFFER_POSITIVE: {
        return OptionStates.YES;
      }
      case OptionTransitions.REQUEST_NEGATIVE:
        return OptionStates.WANT_YES_OPPOSITE;
      case OptionTransitions.REQUEST_POSITIVE:
        // error
        return OptionStates.WANT_YES;
      default:
        return undefined;
    }
  })
  .set(OptionStates.WANT_YES_OPPOSITE, (transition) => {
    switch (transition) {
      case OptionTransitions.OFFER_NEGATIVE:
        return OptionStates.NO;
      case OptionTransitions.OFFER_POSITIVE: {
        // send DONT/WONT
        return OptionStates.WANT_NO;
      }
      case OptionTransitions.REQUEST_NEGATIVE:
        // ignore
        return OptionStates.WANT_YES_OPPOSITE;
      case OptionTransitions.REQUEST_POSITIVE:
        // error
        return OptionStates.WANT_YES;
      default:
        return undefined;
    }
  })
  .set(OptionStates.YES, (transition) => {
    switch (transition) {
      case OptionTransitions.OFFER_NEGATIVE:
        // send DONT
        return OptionStates.NO;
      case OptionTransitions.OFFER_POSITIVE: {
        // ignore
        return OptionStates.YES;
      }
      case OptionTransitions.REQUEST_NEGATIVE:
        // send DONT/WONT
        return OptionStates.WANT_NO;
      case OptionTransitions.REQUEST_POSITIVE:
        // error
        return OptionStates.YES;
      default:
        return undefined;
    }
  });

/** @type {Map<typeof TelnetStates[keyof TelnetStates], ((transition: any) => typeof TelnetStates[keyof TelnetStates])>} */
const telnetStates = new Map()
  .set(TelnetStates.DATA, (transition) => {
    switch (transition) {
      case TelnetCommands.INTERPRET_AS_COMMAND:
        return TelnetStates.INTERPRETING_COMMAND;
      default:
        // write out byte to next stream
        return TelnetStates.DATA;
    }
  })
  .set(TelnetStates.INTERPRETING_COMMAND, (transition) => {
    // .set(TelnetCommands.DO, () => TelnetStates.INTERPRETING_OPTION)
    // .set(TelnetCommands.DONT, () => TelnetStates.INTERPRETING_OPTION)
    switch (transition) {
      case TelnetCommands.INTERPRET_AS_COMMAND:
        return TelnetStates.INTERPRETING_COMMAND;
      case TelnetCommands.WILL:
        return TelnetStates.OFFER_POSITIVE;
      case TelnetCommands.WONT:
        return TelnetStates.OFFER_NEGATIVE;
      case TelnetCommands.SUBNEGOTIATION_BEGIN:
        return TelnetStates.INTERPRETING_SUBNEGOTIATION_BEGIN;
      default:
        return TelnetStates.DATA;
    }
  })
  .set(TelnetStates.OFFER_POSITIVE, (transition) => {
    switch (transition) {
      case TelnetCommands.INTERPRET_AS_COMMAND:
        return TelnetStates.INTERPRETING_COMMAND;
      case TelnetOptions.BINARY_TRANSMISSION:
        // input to option machine
        return TelnetStates.DATA;
      default:
        return TelnetStates.DATA;
    }
  })
  .set(TelnetStates.OFFER_NEGATIVE, (transition) => {
    switch (transition) {
      case TelnetCommands.INTERPRET_AS_COMMAND:
        return TelnetStates.INTERPRETING_COMMAND;
      case TelnetOptions.BINARY_TRANSMISSION:
        // input to option machine
        return TelnetStates.DATA;
      default:
        return TelnetStates.DATA;
    }
  })
  .set(TelnetStates.INTERPRETING_SUBNEGOTIATION_BEGIN, (transition) => {
    switch (transition) {
      case TelnetCommands.INTERPRET_AS_COMMAND:
        return TelnetStates.INTERPRETING_SUBNEGOTIATION_END;
      default:
        // push byte onto buffer
        return TelnetStates.INTERPRETING_SUBNEGOTIATION_BEGIN;
    }
  })
  .set(TelnetStates.INTERPRETING_SUBNEGOTIATION_END, (transition) => {
    switch (transition) {
      case TelnetCommands.SUBNEGOTIATION_END:
        return TelnetStates.DATA;
      default:
        // push IAC and this byte back on the buffer
        return TelnetStates.INTERPRETING_SUBNEGOTIATION_BEGIN;
    }
  });

class TelnetAutomata {
  constructor() {
    const context = this;
    const telnetOptionKeys = Object.keys(TelnetOptions);
    /**
     * @template T
     * @param {Map<T, ReturnType<typeof dfaFactory>>} dfaMap
     * @param {T} optionName
     * @returns {[Map<T, ReturnType<typeof dfaFactory>>, Map<T, ReturnType<typeof dfaFactory>>]}
     */
    const intoOptionNfa = ([theirNfa, ourNfa], optionName) => [
      theirNfa.set(
        optionName,
        nfaFactory(telnetOptionStates, OptionStates.NO, [])
      ),
      ourNfa.set(
        optionName,
        nfaFactory(telnetOptionStates, OptionStates.NO, [])
      ),
    ];
    /** @type {[Iterable<, Map<T, ReturnType<typeof dfaFactory>>]} */
    this.options = telnetOptionKeys.reduce(intoOptionNfa, [
      new Map(),
      new Map(),
    ]);
    /** @type {ReturnType<typeof nfaFactory>} */
    this.streamMachine = nfaFactory(telnetStates, TelnetStates.DATA, []);
  }

  /**
   * @generator
   * @param {Buffer} chunk
   * @yields {void}
   */
  *foobar(chunk) {
    for (let i = 0; i < chunk.length; i++) {
      if (this.streamMachine.q !== this.streamMachine.next(chunk[i]).value) {
        yield this.streamMachine.q;
      }
    }
  }
}

const machine = new TelnetAutomata();

class TelnetStream extends Duplex {
  constructor() {
    super();
    this.cursor = 0;
    this.buffer = Buffer.alloc(2048, 0, "hex");
  }

  /**
   *
   * @param {Buffer | string | any} chunk
   * @param {string} encoding
   * @param {(error?: Error) => void} callback
   */
  _write(chunk, encoding, callback) {
    // console.log(`in: ${chunk.length}`, chunk);
    const nextChunk = Buffer.from(
      chunk,
      // https://nodejs.org/api/stream.html#implementing-a-transform-stream
      // If the chunk is a string, then this is the encoding type.
      // If chunk is a buffer, then this is the special value 'buffer'. Ignore it in that case.
      encoding === "buffer" ? undefined : encoding
    );
    const nextChunkFits = nextChunk.length + this.cursor < this.buffer.length;
    if (nextChunkFits) {
      this.buffer.fill(
        nextChunk,
        this.cursor,
        this.cursor + nextChunk.length,
        "hex"
      );
    } else {
      this.buffer = Buffer.concat(
        [this.buffer, nextChunk],
        this.buffer.length + nextChunk.length * 2
      );
    }
    const nextCursor = this.cursor + nextChunk.length;
    // console.log(`out: ${this.buffer.length}`, this.buffer);
    const machineInput = machine.foobar(chunk);
    for (let stateChange of machineInput) {
      console.log("state changed: ", stateChange, "on", chunk.toString());
    }
    this.cursor = nextCursor;
    callback();
  }
}

const demoStream = new TelnetStream();
demoStream.write(
  Buffer.from([
    TelnetCommands.INTERPRET_AS_COMMAND,
    TelnetCommands.DO,
    TelnetOptions.BINARY_TRANSMISSION,
  ])
);
demoStream.write(Buffer.from("Hello!", "binary"));
demoStream.write(
  Buffer.from([TelnetCommands.INTERPRET_AS_COMMAND, TelnetCommands.GO_AHEAD])
);

// him               | -> wont (offer negative) | -> will (offer positive) | <- do (request positive)   | <- dont (request negative) |
// no                | IGNORE                   | DO yes, DONT no          | DO want yes                | (ERROR)                    |
// want no           | no                       | (ERROR) no               | want no opposite           | (ERROR)                    |
// want no opposite  | DO want yes              | (ERROR) yes*             | (ERROR)                    | want no                    |
// want yes          | no                       | yes                      | (ERROR)                    | want yes opposite          |
// want yes opposite | no                       | DONT want no             | want yes                   | (ERROR)                    |
// yes               | DONT no                  | (IGNORE)                 | (ERROR)                    | DONT want no               |

// us                | -> dont (offer negative) | -> do (offer positive)   | <- will (request positive) | <- wont (request negative) |
// no                | IGNORE                   | WILL yes, WONT no        | WILL want yes              | (ERROR)                    |
// want no           | no                       | (ERROR) no               | want no opposite           | (ERROR)                    |
// want no opposite  | WILL want yes            | (ERROR) yes*             | (ERROR)                    | want no                    |
// want yes          | no                       | yes                      | (ERROR)                    | want yes opposite          |
// want yes opposite | no                       | WONT want no             | want yes                   | (ERROR)                    |
// yes               | WONT no                  | (IGNORE)                 | (ERROR)                    | WONT want no               |

// them/us           | -> wont | -> will  | <- do            | <- dont           |
// no                | -       | want yes | want yes         | error             |
// want no           | no      | ! no     | want no opposite |
// want yes          | no      | yes      | ? yes            | want yes opposite |
// want yes opposite | no      | yes      | want yes         | !                 |

// "Trigger" is the cause of the transition, which could be a signal, an event, a change in some condition, or the passage of time.
// "Guard" is a condition which must be true in order for the trigger to cause the transition.
// "Effect" is an action which will be invoked directly on the object that owns the state machine as a result of the transition. (actions aka effects aka side effects)

// trigger -> next()
// guard   -> userland, just don't return anything
// effect  -> onEnter, onExit

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
