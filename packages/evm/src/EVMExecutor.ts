import {
  Opcodes,
  Operation,
  OperationBlock
} from "@ethereum-react-components/types";
import { CFGBlocks } from "@ethereum-react-components/types/src/CFGBlocks";

import { Executor } from "./operations/Executor";
import { OpcodeExecutor } from "./operations/OpcodeExecutor";

import { EVM } from "./EVM";
import { Word } from "./Word";

export class EVMExecutor {
  public readonly NO_NEXT_BLOCK = [
    "JUMP",
    "STOP",
    "REVERT",
    "RETURN",
    "INVALID"
  ];
  public evm: EVM;
  public blocks: CFGBlocks;
  public executor: OpcodeExecutor;
  public alreadyRunOffsets: number[] = [];

  constructor(blocks: CFGBlocks) {
    this.evm = new EVM();
    this.blocks = blocks;
    this.executor = new OpcodeExecutor();
  }

  public run(offset: number) {
    const block: OperationBlock = this.blocks.get(offset);
    if (!block) {
      throw new Error(`Could not find block with offset ${offset}`);
    }
    this.runBlock(block);
    this.alreadyRunOffsets.push(offset);
    const nextBlocks: OperationBlock[] = this.findNextBlocks(block);
    for (const nextBlock of nextBlocks) {
      if (
        block.childA !== nextBlock.offset &&
        block.childB !== nextBlock.offset
      ) {
        if (!block.childA) {
          block.childA = nextBlock.offset;
        } else if (!block.childB) {
          block.childB = nextBlock.offset;
        }
      }
      if (
        nextBlock.offset !== 0 &&
        !this.alreadyRunOffsets.includes(nextBlock.offset)
      ) {
        this.run(nextBlock.offset);
      }
    }
  }

  public runOrphans() {
    while (this.blocks.keys().length !== this.alreadyRunOffsets.length) {
      // logger.info(`There are ${this.blocks.keys().length - this.alreadyRunOffsets.length} orphan block(s) that need to be analyzed`)
      const pickOrphan = this.blocks
        .keys()
        .find(key => !this.alreadyRunOffsets.includes(key));
      // TODO
      if (pickOrphan) {
        this.alreadyRunOffsets.push(pickOrphan);
        const orphanBlock = this.blocks.get(pickOrphan);
        if (orphanBlock) {
          const nextBlocks: OperationBlock[] = this.findNextBlocks(orphanBlock);
          for (const nextBlock of nextBlocks) {
            if (
              orphanBlock.childA !== nextBlock.offset &&
              orphanBlock.childB !== nextBlock.offset
            ) {
              if (!orphanBlock.childA) {
                orphanBlock.childA = nextBlock.offset;
              } else if (!orphanBlock.childB) {
                orphanBlock.childB = nextBlock.offset;
              }
            }
          }
        }
      }
    }
  }

  private runBlock(block: OperationBlock) {
    for (const op of block.operations) {
      const executor: Executor = this.executor.ops[op.opcode.name];
      if (!executor) {
        throw new Error(`Operation not implemented: ${op.opcode.name}`);
      }
      executor.execute(op, this.evm);
    }
  }

  private findNextBlocks(block: OperationBlock): OperationBlock[] {
    const nextBlocks: OperationBlock[] = [];
    const ops = block.operations;
    const lastOp: Operation = ops[ops.length - 1];
    if (Opcodes.isJump(lastOp.opcode)) {
      let jumpLocation = this.evm.nextJumpLocation;
      this.evm.nextJumpLocation = undefined;
      if (!jumpLocation) {
        // try to get it heuristically
        const prevLastOpcode = ops[ops.length - 2];
        if (prevLastOpcode.opcode.name.startsWith("PUSH")) {
          jumpLocation = Word.createLiteral(prevLastOpcode.argument);
        }
      }

      if (jumpLocation && !jumpLocation.isSymbolic) {
        const nextOffset = jumpLocation.value.toNumber();
        const locationBlock: OperationBlock = this.blocks.get(nextOffset);
        if (locationBlock) {
          nextBlocks.push(locationBlock);
        }
      }
    }
    if (!this.NO_NEXT_BLOCK.includes(lastOp.opcode.name)) {
      const nextOffset = lastOp.offset + 1;
      const nextBlock = this.blocks.get(nextOffset);
      if (nextBlock) {
        nextBlocks.push(nextBlock);
      }
    }
    return nextBlocks;
  }
}
