import { CompilerVersion } from '@ethereum-react/types'

import { IDisassembler, DisassembledContract, EVMDisassembler } from '../../src'

let BN = require('bn.js')

describe('Disassembler test', () => {
  let disassemblerInstance: IDisassembler

  beforeEach(() => {
    disassemblerInstance = new EVMDisassembler()
  })

  it('Test disassembler bytecode', async () => {
    const bytecode = '0x161718'
    const expectedOpcodes = [
      { offset: 0, opcode: { name: 'AND', opcode: 0x16, parameters: 0 }, argument: new BN('0', 16) },
      { offset: 1, opcode: { name: 'OR', opcode: 0x17, parameters: 0 }, argument: new BN('0', 16) },
      { offset: 2, opcode: { name: 'XOR', opcode: 0x18, parameters: 0 }, argument: new BN('0', 16) }
    ]
    const opcodes = disassemblerInstance.disassembleBytecode(bytecode)
    expect(opcodes).toEqual(expectedOpcodes)
  })

  it('Test disassembler bytecode with push1', async () => {
    const bytecode = '60406080'
    const expectedOpcodes = [
      { offset: 0, opcode: { name: 'PUSH1', opcode: 0x60, parameters: 1 }, argument: new BN(`40`, 16) },
      { offset: 2, opcode: { name: 'PUSH1', opcode: 0x60, parameters: 1 }, argument: new BN(`80`, 16) }
    ]
    const opcodes = disassemblerInstance.disassembleBytecode(bytecode)
    expect(opcodes).toEqual(expectedOpcodes)
  })

  it('Test disassembler bytecode with push1 starting with 0x', async () => {
    const bytecode = '0x60406080'
    const expectedOpcodes = [
      { offset: 0, opcode: { name: 'PUSH1', opcode: 0x60, parameters: 1 }, argument: new BN(`40`, 16) },
      { offset: 2, opcode: { name: 'PUSH1', opcode: 0x60, parameters: 1 }, argument: new BN(`80`, 16) }
    ]
    const opcodes = disassemblerInstance.disassembleBytecode(bytecode)
    expect(opcodes).toEqual(expectedOpcodes)
  })

  it('Test combined contract runtime init', () => {
    const bytecode = '0x608060405260043610610041576000357c010000000000000000000000000000000000000000000000000000000090'
    const expectedOpcodes = [
      { offset: 0, opcode: { name: 'PUSH1', opcode: 0x60, parameters: 1 }, argument: new BN(`80`, 16) },
      { offset: 2, opcode: { name: 'PUSH1', opcode: 0x60, parameters: 1 }, argument: new BN(`40`, 16) },
      { offset: 4, opcode: { name: 'MSTORE', opcode: 0x52, parameters: 0 }, argument: new BN(`0`, 16) },
      { offset: 5, opcode: { name: 'PUSH1', opcode: 0x60, parameters: 1 }, argument: new BN(`04`, 16) },
      { offset: 7, opcode: { name: 'CALLDATASIZE', opcode: 0x36, parameters: 0 }, argument: new BN(`0`, 16) },
      { offset: 8, opcode: { name: 'LT', opcode: 0x10, parameters: 0 }, argument: new BN(`0`, 16) },
      { offset: 9, opcode: { name: 'PUSH2', opcode: 0x61, parameters: 2 }, argument: new BN(`0041`, 16) },
      { offset: 12, opcode: { name: 'JUMPI', opcode: 0x57, parameters: 0 }, argument: new BN(`0`, 16) },
      { offset: 13, opcode: { name: 'PUSH1', opcode: 0x60, parameters: 1 }, argument: new BN(`0`, 16) },
      { offset: 15, opcode: { name: 'CALLDATALOAD', opcode: 0x35, parameters: 0 }, argument: new BN(`0`, 16) },
      {
        offset: 16,
        opcode: { name: 'PUSH29', opcode: 0x7c, parameters: 29 },
        argument: new BN(`0100000000000000000000000000000000000000000000000000000000`, 16)
      },
      { offset: 46, opcode: { name: 'SWAP1', opcode: 0x90, parameters: 0 }, argument: new BN(`0`, 16) }
    ]
    const opcodes = disassemblerInstance.disassembleBytecode(bytecode)
    expect(opcodes).toEqual(expectedOpcodes)
  })

  it('Test disassemble contract with version 5.3', () => {
    const bytecode = '608060405234801561001057600080fd5b506103e86000819055506107d0600181905550610152806100326000396000f3fe608060405234801561001057600080fd5b5060043610610069576000357c0100000000000000000000000000000000000000000000000000000000900480633fa4f2451461006e578063552410771461008c578063d6ab10b4146100ba578063f9f16ef2146100e8575b600080fd5b610076610106565b6040518082815260200191505060405180910390f35b6100b8600480360360208110156100a257600080fd5b810190808035906020019092919050505061010c565b005b6100e6600480360360208110156100d057600080fd5b8101908080359060200190929190505050610116565b005b6100f0610120565b6040518082815260200191505060405180910390f35b60005481565b8060008190555050565b8060018190555050565b6001548156fea165627a7a723058209acb4546d7af997cefc4763e910bdfbacf42dc35015954b1bf8b24ad557b16370029'
    const contract: DisassembledContract = disassemblerInstance.disassembleContract(bytecode, CompilerVersion.SOLIDITY_5)
    const constructor = contract.constructorOperations
    const runtime = contract.runtimeOperations
    const firstConstructor = constructor[0]
    const lastConstructor = constructor[constructor.length - 1]
    const firstRuntime = runtime[0]
    const lastRuntime = runtime[runtime.length - 1]
    expect(contract.hasConstructor).toBeTruthy()
    expect(firstConstructor.opcode.name).toEqual('PUSH1')
    expect(lastConstructor.opcode.name).toEqual('INVALID')
    expect(firstRuntime.opcode.name).toEqual('PUSH1')
    expect(lastRuntime.opcode.name).toEqual('INVALID')
    expect(firstConstructor.offset).toEqual(0)
    expect(firstRuntime.offset).toEqual(0)
    expect(contract.bytecode).toEqual(bytecode)
  })

  it.skip('Test disassemble contract with version 5.16', () => {
    const bytecode = '6080604052348015600f57600080fd5b506004361060325760003560e01c8063209652551460375780635524107714604f575b600080fd5b603d606b565b60408051918252519081900360200190f35b606960048036036020811015606357600080fd5b50356071565b005b60005490565b60005556fea265627a7a72315820a4b47dcb545f17ba5f5b036db7eb3b5f0cd57b8441515135e18f3fe1f87ed3cb64736f6c63430005100032'
    const contract: DisassembledContract = disassemblerInstance.disassembleContract(bytecode, CompilerVersion.SOLIDITY_5)
    console.log("CONTRACT", contract)
    // const constructor = contract.constructor
    // const runtime = contract.runtime
    // const firstConstructor = constructor[0]
    // const lastConstructor = constructor[constructor.length - 1]
    // const firstRuntime = runtime[0]
    // const lastRuntime = runtime[runtime.length - 1]
    // expect(contract.hasConstructor).toBeTruthy()
    // expect(firstConstructor.opcode.name).toEqual('PUSH1')
    // expect(lastConstructor.opcode.name).toEqual('INVALID')
    // expect(firstRuntime.opcode.name).toEqual('PUSH1')
    // expect(lastRuntime.opcode.name).toEqual('INVALID')
    // expect(firstConstructor.offset).toEqual(0)
    // expect(firstRuntime.offset).toEqual(0)
    // expect(contract.bytecode).toEqual(bytecode)
  })

  it.skip('test with version 6', () => {
    const bytecode = '608060405234801561001057600080fd5b506103e860008190555060c7806100286000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632096525514603757806355241077146053575b600080fd5b603d607e565b6040518082815260200191505060405180910390f35b607c60048036036020811015606757600080fd5b81019080803590602001909291905050506087565b005b60008054905090565b806000819055505056fea2646970667358221220c76c28bb7e140b61be95d2269a213263968ab7e2049fee57bb76b48884a43fa664736f6c63430006020033'

  })
  it('Test disassemble contract only runtime', () => {
    const bytecode = '60806040'
    const contract: DisassembledContract = disassemblerInstance.disassembleContract(bytecode)

    expect(contract.hasConstructor).toBeFalsy()
    expect(contract.constructorOperations.length).toEqual(0)
    expect(contract.bytecode).toEqual(bytecode)
  })

  it('Test odd disassembler bytecode', async () => {
    const bytecode = '0x16171'
    expect(() => disassemblerInstance.disassembleBytecode(bytecode)).toThrow()
  })
})
