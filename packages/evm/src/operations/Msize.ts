import { Executor } from "./Executor";
import { EVM } from "../EVM";
import { Operation } from "@ethereum-react-components/types";
import { Word } from "../Word";

export class Msize implements Executor {
  execute(op: Operation, evm: EVM) {
    evm.stack.push(Word.createLiteral(evm.memory.wordCount().toString(16)));
  }
}
