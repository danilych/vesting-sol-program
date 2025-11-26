import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VestingSolProgram } from "../target/types/vesting_sol_program";
import { assert } from "chai";

describe("vesting-sol-program", async () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.VestingSolProgram as Program<VestingSolProgram>;

  const alice = anchor.web3.Keypair.generate();
  const bob = anchor.web3.Keypair.generate();
  const treasury = anchor.web3.Keypair.generate();

  // Vesting account keypairs
  const vestingAccountAlice = anchor.web3.Keypair.generate();
  const vestingAccountBob = anchor.web3.Keypair.generate();

  // Vesting record keypairs
  const vestingRecordAlice1 = anchor.web3.Keypair.generate();
  const vestingRecordAlice2 = anchor.web3.Keypair.generate();
  const vestingRecordBob1 = anchor.web3.Keypair.generate();

  const CREATION_FEE = new anchor.BN(1_000_000); // 0.001 SOL
  const CREATION_FEE_LARGE = new anchor.BN(5_000_000); // 0.005 SOL

  function getVestingStoragePDA(vestingRecordPublicKey: anchor.web3.PublicKey) {
    const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vesting_storage"),
        vestingRecordPublicKey.toBuffer()
      ],
      program.programId
    );
    return pda;
  }

  it("Initialize Vesting Account Alice", async () => {
    await airdrop(provider.connection, alice.publicKey);
    await airdrop(provider.connection, treasury.publicKey);

    const txSig = await program.methods
      .initialize(CREATION_FEE)
      .accounts({
        vesting: vestingAccountAlice.publicKey,
        owner: alice.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([alice, vestingAccountAlice])
      .rpc({ commitment: "confirmed" });

    const vestingData = await program.account.vesting.fetch(vestingAccountAlice.publicKey);
    assert.strictEqual(
      vestingData.owner.toString(),
      alice.publicKey.toString(),
      "Vesting owner should be Alice's public key"
    );
    assert.strictEqual(
      vestingData.creationFee.toString(),
      CREATION_FEE.toString(),
      "Creation fee should match"
    );
  });

  it("Initialize Vesting Account Bob", async () => {
    await airdrop(provider.connection, bob.publicKey);

    const txSig = await program.methods
      .initialize(CREATION_FEE_LARGE)
      .accounts({
        vesting: vestingAccountBob.publicKey,
        owner: bob.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([bob, vestingAccountBob])
      .rpc({ commitment: "confirmed" });

    const vestingData = await program.account.vesting.fetch(vestingAccountBob.publicKey);
    assert.strictEqual(
      vestingData.owner.toString(),
      bob.publicKey.toString(),
      "Vesting owner should be Bob's public key"
    );
    assert.strictEqual(
      vestingData.creationFee.toString(),
      CREATION_FEE_LARGE.toString(),
      "Creation fee should match"
    );
  });

  it("Cannot initialize vesting with zero creation fee", async () => {
    const charlie = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, charlie.publicKey);
    const vestingAccountCharlie = anchor.web3.Keypair.generate();

    let flag = "This should fail";
    try {
      await program.methods
        .initialize(new anchor.BN(0))
        .accounts({
          vesting: vestingAccountCharlie.publicKey,
          owner: charlie.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([charlie, vestingAccountCharlie])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidAmount",
        "Should fail with InvalidAmount error"
      );
    }
    assert.strictEqual(flag, "Failed", "Initializing with zero creation fee should fail");
  });

  it("Cannot initialize vesting account twice", async () => {
    let flag = "This should fail";
    try {
      await program.methods
        .initialize(CREATION_FEE)
        .accounts({
          vesting: vestingAccountAlice.publicKey,
          owner: alice.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([alice, vestingAccountAlice])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      // Should fail because account already exists
      assert.isTrue(
        error.toString().includes("already in use") || error.toString().includes("Error"),
        "Should fail with account already in use error"
      );
    }
    assert.strictEqual(flag, "Failed", "Initializing vesting account twice should fail");
  });

  it("Create Vesting Record for Alice (10 periods)", async () => {
    await airdrop(provider.connection, treasury.publicKey);

    const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);
    const aliceBalanceBefore = await provider.connection.getBalance(alice.publicKey);

    const amount = new anchor.BN(10_000_000); // 0.01 SOL
    const currentTime = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(currentTime + 2); // Starts in 2 seconds
    const endTime = new anchor.BN(currentTime + 10002);
    const periods = new anchor.BN(10);
    const periodDuration = new anchor.BN(1000); // 1000 seconds per period
    const amountPerPeriod = new anchor.BN(1_000_000); // 0.001 SOL per period

    const vestingStoragePDA = getVestingStoragePDA(vestingRecordAlice1.publicKey);

    const txSig = await program.methods
      .createVesting(amount, startTime, endTime, periods, periodDuration, amountPerPeriod)
      .accounts({
        owner: alice.publicKey,
        vestingRecord: vestingRecordAlice1.publicKey,
        vestingStorage: vestingStoragePDA,
        vesting: vestingAccountAlice.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([alice, vestingRecordAlice1])
      .rpc({ commitment: "confirmed" });

    const vestingRecordData = await program.account.vestingRecord.fetch(
      vestingRecordAlice1.publicKey
    );
    assert.strictEqual(
      vestingRecordData.owner.toString(),
      alice.publicKey.toString(),
      "Vesting record owner should be Alice"
    );
    assert.strictEqual(
      vestingRecordData.amount.toString(),
      amount.toString(),
      "Amount should match"
    );
    assert.strictEqual(
      vestingRecordData.startTime.toString(),
      startTime.toString(),
      "Start time should match"
    );
    assert.strictEqual(
      vestingRecordData.endTime.toString(),
      endTime.toString(),
      "End time should match"
    );
    assert.strictEqual(
      vestingRecordData.periods.toString(),
      periods.toString(),
      "Periods should match"
    );
    assert.strictEqual(
      vestingRecordData.periodDuration.toString(),
      periodDuration.toString(),
      "Period duration should match"
    );
    assert.strictEqual(
      vestingRecordData.amountPerPeriod.toString(),
      amountPerPeriod.toString(),
      "Amount per period should match"
    );
    assert.strictEqual(
      vestingRecordData.storagePda.toString(),
      vestingStoragePDA.toString(),
      "Storage PDA should match"
    );
    assert.strictEqual(
      vestingRecordData.claimedAmount.toString(),
      "0",
      "Claimed amount should start at 0"
    );

    const storagePDABalance = await provider.connection.getBalance(vestingStoragePDA);
    assert.isTrue(
      storagePDABalance >= amount.toNumber(),
      "Storage PDA should receive staked SOL"
    );

    const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
    assert.isTrue(
      treasuryBalanceAfter >= treasuryBalanceBefore + CREATION_FEE.toNumber(),
      "Treasury should receive creation fee"
    );
  });

  it("Can claim vested tokens after period passes", async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));

    const vestingStoragePDA = getVestingStoragePDA(vestingRecordAlice1.publicKey);
    const aliceBalanceBefore = await provider.connection.getBalance(alice.publicKey);
    const storagePDABalanceBefore = await provider.connection.getBalance(vestingStoragePDA);

    await program.methods
      .claim()
      .accounts({
        owner: alice.publicKey,
        vestingRecord: vestingRecordAlice1.publicKey,
        vestingStorage: vestingStoragePDA,
      })
      .signers([alice])
      .rpc({ commitment: "confirmed" });

    const aliceBalanceAfter = await provider.connection.getBalance(alice.publicKey);
    const storagePDABalanceAfter = await provider.connection.getBalance(vestingStoragePDA);
    const vestingRecordData = await program.account.vestingRecord.fetch(
      vestingRecordAlice1.publicKey
    );

    assert.isTrue(
      vestingRecordData.claimedAmount.toNumber() > 0,
      "Claimed amount should be greater than 0"
    );
    assert.isTrue(
      storagePDABalanceAfter < storagePDABalanceBefore,
      "Storage PDA balance should decrease"
    );
    assert.isTrue(
      aliceBalanceAfter > aliceBalanceBefore,
      "Alice balance should increase"
    );
  });

  it("Cannot claim if nothing is vested yet (no time elapsed)", async () => {
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordAlice1.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .claim()
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordAlice1.publicKey,
          vestingStorage: vestingStoragePDA,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidAmount",
        "Should fail with InvalidAmount error"
      );
    }
    assert.strictEqual(flag, "Failed", "Claiming with nothing vested should fail");
  });

  it("Cannot claim before vesting start time", async () => {
    const vestingRecordTest = anchor.web3.Keypair.generate();
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);
    const currentTime = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(currentTime + 10000);

    await program.methods
      .createVesting(
        new anchor.BN(10_000_000),
        startTime,
        new anchor.BN(currentTime + 20000),
        new anchor.BN(10),
        new anchor.BN(1000),
        new anchor.BN(1_000_000)
      )
      .accounts({
        owner: alice.publicKey,
        vestingRecord: vestingRecordTest.publicKey,
        vestingStorage: vestingStoragePDA,
        vesting: vestingAccountAlice.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([alice, vestingRecordTest])
      .rpc({ commitment: "confirmed" });

    let flag = "This should fail";
    try {
      await program.methods
        .claim()
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidStartTimestamp",
        "Should fail with InvalidStartTimestamp error"
      );
    }
    assert.strictEqual(flag, "Failed", "Claiming before start time should fail");
  });

  it("Cannot claim from wrong owner", async () => {
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordAlice1.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .claim()
        .accounts({
          owner: bob.publicKey,
          vestingRecord: vestingRecordAlice1.publicKey,
          vestingStorage: vestingStoragePDA,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      assert.isTrue(
        error.toString().includes("ConstraintRaw") || 
        error.toString().includes("Error") ||
        error.toString().includes("CustomError"),
        "Should fail with constraint error"
      );
    }
    assert.strictEqual(flag, "Failed", "Claiming from wrong owner should fail");
  });

  it("Cannot claim twice with no additional vesting period", async () => {
    const vestingRecordTest = anchor.web3.Keypair.generate();
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);
    const currentTime = Math.floor(Date.now() / 1000);

    await program.methods
      .createVesting(
        new anchor.BN(10_000_000),
        new anchor.BN(currentTime),
        new anchor.BN(currentTime + 10000),
        new anchor.BN(10),
        new anchor.BN(1000),
        new anchor.BN(1_000_000)
      )
      .accounts({
        owner: alice.publicKey,
        vestingRecord: vestingRecordTest.publicKey,
        vestingStorage: vestingStoragePDA,
        vesting: vestingAccountAlice.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([alice, vestingRecordTest])
      .rpc({ commitment: "confirmed" });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await program.methods
      .claim()
      .accounts({
        owner: alice.publicKey,
        vestingRecord: vestingRecordTest.publicKey,
        vestingStorage: vestingStoragePDA,
      })
      .signers([alice])
      .rpc({ commitment: "confirmed" });

    let flag = "This should fail";
    try {
      await program.methods
        .claim()
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidAmount",
        "Should fail with InvalidAmount error"
      );
    }
    assert.strictEqual(flag, "Failed", "Claiming twice without time passing should fail");
  });

  it("Create Vesting Record for Alice (5 periods, different amounts)", async () => {
    const amount = new anchor.BN(5_000_000); // 0.005 SOL
    const currentTime = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(currentTime + 120);
    const endTime = new anchor.BN(currentTime + 5120);
    const periods = new anchor.BN(5);
    const periodDuration = new anchor.BN(1000);
    const amountPerPeriod = new anchor.BN(1_000_000); // 0.001 SOL per period

    const vestingStoragePDA = getVestingStoragePDA(vestingRecordAlice2.publicKey);

    const txSig = await program.methods
      .createVesting(amount, startTime, endTime, periods, periodDuration, amountPerPeriod)
      .accounts({
        owner: alice.publicKey,
        vestingRecord: vestingRecordAlice2.publicKey,
        vestingStorage: vestingStoragePDA,
        vesting: vestingAccountAlice.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([alice, vestingRecordAlice2])
      .rpc({ commitment: "confirmed" });

    const vestingRecordData = await program.account.vestingRecord.fetch(
      vestingRecordAlice2.publicKey
    );
    assert.strictEqual(
      vestingRecordData.amount.toString(),
      amount.toString(),
      "Amount should match"
    );
    assert.strictEqual(
      vestingRecordData.periods.toString(),
      periods.toString(),
      "Periods should match"
    );
  });

  it("Create Vesting Record for Bob", async () => {
    const amount = new anchor.BN(20_000_000); // 0.02 SOL
    const currentTime = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(currentTime + 300);
    const endTime = new anchor.BN(currentTime + 20300);
    const periods = new anchor.BN(20);
    const periodDuration = new anchor.BN(1000);
    const amountPerPeriod = new anchor.BN(1_000_000);

    const vestingStoragePDA = getVestingStoragePDA(vestingRecordBob1.publicKey);

    const txSig = await program.methods
      .createVesting(amount, startTime, endTime, periods, periodDuration, amountPerPeriod)
      .accounts({
        owner: bob.publicKey,
        vestingRecord: vestingRecordBob1.publicKey,
        vestingStorage: vestingStoragePDA,
        vesting: vestingAccountBob.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([bob, vestingRecordBob1])
      .rpc({ commitment: "confirmed" });

    const vestingRecordData = await program.account.vestingRecord.fetch(
      vestingRecordBob1.publicKey
    );
    assert.strictEqual(
      vestingRecordData.owner.toString(),
      bob.publicKey.toString(),
      "Vesting record owner should be Bob"
    );
  });

  it("Cannot create vesting with zero amount", async () => {
    const vestingRecordTest = anchor.web3.Keypair.generate();
    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .createVesting(
          new anchor.BN(0),
          new anchor.BN(currentTime + 60),
          new anchor.BN(currentTime + 1060),
          new anchor.BN(10),
          new anchor.BN(100),
          new anchor.BN(0)
        )
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountAlice.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([alice, vestingRecordTest])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidAmount",
        "Should fail with InvalidAmount error"
      );
    }
    assert.strictEqual(flag, "Failed", "Creating vesting with zero amount should fail");
  });

  it("Cannot create vesting with start time in the past", async () => {
    const vestingRecordTest = anchor.web3.Keypair.generate();
    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .createVesting(
          new anchor.BN(1_000_000),
          new anchor.BN(currentTime - 100), // Past time
          new anchor.BN(currentTime + 1000),
          new anchor.BN(10),
          new anchor.BN(100),
          new anchor.BN(100_000)
        )
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountAlice.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([alice, vestingRecordTest])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidStartTimestamp",
        "Should fail with InvalidStartTimestamp error"
      );
    }
    assert.strictEqual(flag, "Failed", "Creating vesting with past start time should fail");
  });

  it("Cannot create vesting with end time before start time", async () => {
    const vestingRecordTest = anchor.web3.Keypair.generate();
    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .createVesting(
          new anchor.BN(1_000_000),
          new anchor.BN(currentTime + 1000),
          new anchor.BN(currentTime + 500), // End before start
          new anchor.BN(10),
          new anchor.BN(100),
          new anchor.BN(100_000)
        )
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountAlice.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([alice, vestingRecordTest])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidEndTimestamp",
        "Should fail with InvalidEndTimestamp error"
      );
    }
    assert.strictEqual(flag, "Failed", "Creating vesting with end before start should fail");
  });

  it("Cannot create vesting with zero periods", async () => {
    const vestingRecordTest = anchor.web3.Keypair.generate();
    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .createVesting(
          new anchor.BN(1_000_000),
          new anchor.BN(currentTime + 60),
          new anchor.BN(currentTime + 1060),
          new anchor.BN(0), // Zero periods
          new anchor.BN(100),
          new anchor.BN(100_000)
        )
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountAlice.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([alice, vestingRecordTest])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidPeriodsConfiguration",
        "Should fail with InvalidPeriodsConfiguration error"
      );
    }
    assert.strictEqual(flag, "Failed", "Creating vesting with zero periods should fail");
  });

  it("Cannot create vesting with zero period duration", async () => {
    const vestingRecordTest = anchor.web3.Keypair.generate();
    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .createVesting(
          new anchor.BN(1_000_000),
          new anchor.BN(currentTime + 60),
          new anchor.BN(currentTime + 1060),
          new anchor.BN(10),
          new anchor.BN(0), // Zero period duration
          new anchor.BN(100_000)
        )
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountAlice.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([alice, vestingRecordTest])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidPeriodsConfiguration",
        "Should fail with InvalidPeriodsConfiguration error"
      );
    }
    assert.strictEqual(flag, "Failed", "Creating vesting with zero period duration should fail");
  });

  it("Cannot create vesting with mismatched amount calculation", async () => {
    const vestingRecordTest = anchor.web3.Keypair.generate();
    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .createVesting(
          new anchor.BN(1_000_000), // 1M
          new anchor.BN(currentTime + 60),
          new anchor.BN(currentTime + 1060),
          new anchor.BN(10), // 10 periods
          new anchor.BN(100),
          new anchor.BN(50_000) // 50k per period = 500k total (mismatch!)
        )
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountAlice.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([alice, vestingRecordTest])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InvalidPeriodsConfiguration",
        "Should fail with InvalidPeriodsConfiguration error"
      );
    }
    assert.strictEqual(flag, "Failed", "Creating vesting with mismatched amounts should fail");
  });

  it("Cannot create vesting with insufficient balance for creation fee", async () => {
    const charlie = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, charlie.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL); // Only 2 SOL

    const vestingAccountCharlie = anchor.web3.Keypair.generate();
    const vestingRecordCharlie = anchor.web3.Keypair.generate();

    // Initialize vesting with high creation fee
    await program.methods
      .initialize(new anchor.BN(10 * anchor.web3.LAMPORTS_PER_SOL)) // 10 SOL fee
      .accounts({
        vesting: vestingAccountCharlie.publicKey,
        owner: charlie.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([charlie, vestingAccountCharlie])
      .rpc({ commitment: "confirmed" });

    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordCharlie.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .createVesting(
          new anchor.BN(1_000_000),
          new anchor.BN(currentTime + 60),
          new anchor.BN(currentTime + 1060),
          new anchor.BN(10),
          new anchor.BN(100),
          new anchor.BN(100_000)
        )
        .accounts({
          owner: charlie.publicKey,
          vestingRecord: vestingRecordCharlie.publicKey,
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountCharlie.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([charlie, vestingRecordCharlie])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      const err = anchor.AnchorError.parse(error.logs);
      assert.strictEqual(
        err.error.errorCode.code,
        "InsufficientBalance",
        "Should fail with InsufficientBalance error"
      );
    }
    assert.strictEqual(
      flag,
      "Failed",
      "Creating vesting without sufficient balance for fee should fail"
    );
  });

  it("Cannot create vesting with wrong treasury", async () => {
    const vestingRecordTest = anchor.web3.Keypair.generate();
    const wrongTreasury = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, wrongTreasury.publicKey);

    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .createVesting(
          new anchor.BN(1_000_000),
          new anchor.BN(currentTime + 60),
          new anchor.BN(currentTime + 1060),
          new anchor.BN(10),
          new anchor.BN(100),
          new anchor.BN(100_000)
        )
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountAlice.publicKey,
          treasury: wrongTreasury.publicKey, // Wrong treasury
        })
        .signers([alice, vestingRecordTest])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      // Should fail due to constraint check
      assert.isTrue(
        error.toString().includes("ConstraintRaw") || error.toString().includes("Error"),
        "Should fail with constraint error"
      );
    }
    assert.strictEqual(flag, "Failed", "Creating vesting with wrong treasury should fail");
  });

  it("Cannot create vesting record twice with same keypair", async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordAlice1.publicKey);

    let flag = "This should fail";
    try {
      await program.methods
        .createVesting(
          new anchor.BN(5_000_000),
          new anchor.BN(currentTime + 60),
          new anchor.BN(currentTime + 1060),
          new anchor.BN(5),
          new anchor.BN(200),
          new anchor.BN(1_000_000)
        )
        .accounts({
          owner: alice.publicKey,
          vestingRecord: vestingRecordAlice1.publicKey, // Reusing existing record
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountAlice.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([alice, vestingRecordAlice1])
        .rpc({ commitment: "confirmed" });
    } catch (error) {
      flag = "Failed";
      assert.isTrue(
        error.toString().includes("already in use") || error.toString().includes("Error"),
        "Should fail with account already in use error"
      );
    }
    assert.strictEqual(flag, "Failed", "Creating vesting record twice should fail");
  });

  it("Different users can create vesting records with same vesting account parameters", async () => {
    const dave = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, dave.publicKey);

    const vestingRecordDave = anchor.web3.Keypair.generate();
    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA = getVestingStoragePDA(vestingRecordDave.publicKey);

    await program.methods
      .createVesting(
        new anchor.BN(10_000_000),
        new anchor.BN(currentTime + 60),
        new anchor.BN(currentTime + 10060),
        new anchor.BN(10),
        new anchor.BN(1000),
        new anchor.BN(1_000_000)
      )
      .accounts({
        owner: dave.publicKey,
        vestingRecord: vestingRecordDave.publicKey,
        vestingStorage: vestingStoragePDA,
        vesting: vestingAccountAlice.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([dave, vestingRecordDave])
      .rpc({ commitment: "confirmed" });

    const vestingRecordData = await program.account.vestingRecord.fetch(
      vestingRecordDave.publicKey
    );
    assert.strictEqual(
      vestingRecordData.owner.toString(),
      dave.publicKey.toString(),
      "Vesting record owner should be Dave"
    );
  });

  it("Can create multiple vesting records with different configurations", async () => {
    const eve = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, eve.publicKey);

    const vestingRecordEve1 = anchor.web3.Keypair.generate();
    const vestingRecordEve2 = anchor.web3.Keypair.generate();
    const currentTime = Math.floor(Date.now() / 1000);
    const vestingStoragePDA1 = getVestingStoragePDA(vestingRecordEve1.publicKey);

    await program.methods
      .createVesting(
        new anchor.BN(100_000_000), // 0.1 SOL
        new anchor.BN(currentTime + 60),
        new anchor.BN(currentTime + 100060),
        new anchor.BN(100),
        new anchor.BN(1000),
        new anchor.BN(1_000_000)
      )
      .accounts({
        owner: eve.publicKey,
        vestingRecord: vestingRecordEve1.publicKey,
        vestingStorage: vestingStoragePDA1,
        vesting: vestingAccountAlice.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([eve, vestingRecordEve1])
      .rpc({ commitment: "confirmed" });

    const vestingStoragePDA2 = getVestingStoragePDA(vestingRecordEve2.publicKey);

    await program.methods
      .createVesting(
        new anchor.BN(50_000_000), // 0.05 SOL
        new anchor.BN(currentTime + 120),
        new anchor.BN(currentTime + 10120),
        new anchor.BN(1),
        new anchor.BN(10000),
        new anchor.BN(50_000_000)
      )
      .accounts({
        owner: eve.publicKey,
        vestingRecord: vestingRecordEve2.publicKey,
        vestingStorage: vestingStoragePDA2,
        vesting: vestingAccountAlice.publicKey,
        treasury: treasury.publicKey,
      })
      .signers([eve, vestingRecordEve2])
      .rpc({ commitment: "confirmed" });

    const record1 = await program.account.vestingRecord.fetch(vestingRecordEve1.publicKey);
    const record2 = await program.account.vestingRecord.fetch(vestingRecordEve2.publicKey);

    assert.strictEqual(record1.periods.toString(), "100", "First record should have 100 periods");
    assert.strictEqual(record2.periods.toString(), "1", "Second record should have 1 period");
  });

  describe("Admin Functions", () => {
    it("Owner can update creation fee", async () => {
      const oldFee = CREATION_FEE;
      const newFee = new anchor.BN(2_000_000); // 0.002 SOL

      await program.methods
        .updateCreationFee(newFee)
        .accounts({
          vesting: vestingAccountAlice.publicKey,
          owner: alice.publicKey,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      const vestingData = await program.account.vesting.fetch(
        vestingAccountAlice.publicKey
      );
      assert.strictEqual(
        vestingData.creationFee.toString(),
        newFee.toString(),
        "Creation fee should be updated"
      );

      await program.methods
        .updateCreationFee(oldFee)
        .accounts({
          vesting: vestingAccountAlice.publicKey,
          owner: alice.publicKey,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
    });

    it("Owner can update treasury", async () => {
      const newTreasury = anchor.web3.Keypair.generate();

      await program.methods
        .updateTreasury(newTreasury.publicKey)
        .accounts({
          vesting: vestingAccountAlice.publicKey,
          owner: alice.publicKey,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      const vestingData = await program.account.vesting.fetch(
        vestingAccountAlice.publicKey
      );
      assert.strictEqual(
        vestingData.treasury.toString(),
        newTreasury.publicKey.toString(),
        "Treasury should be updated"
      );

      await program.methods
        .updateTreasury(treasury.publicKey)
        .accounts({
          vesting: vestingAccountAlice.publicKey,
          owner: alice.publicKey,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });
    });

    it("Owner can transfer ownership", async () => {
      const newOwner = anchor.web3.Keypair.generate();

      await program.methods
        .transferOwnership(newOwner.publicKey)
        .accounts({
          vesting: vestingAccountAlice.publicKey,
          owner: alice.publicKey,
        })
        .signers([alice])
        .rpc({ commitment: "confirmed" });

      const vestingData = await program.account.vesting.fetch(
        vestingAccountAlice.publicKey
      );
      assert.strictEqual(
        vestingData.owner.toString(),
        newOwner.publicKey.toString(),
        "Owner should be updated"
      );

      await program.methods
        .transferOwnership(alice.publicKey)
        .accounts({
          vesting: vestingAccountAlice.publicKey,
          owner: newOwner.publicKey,
        })
        .signers([newOwner])
        .rpc({ commitment: "confirmed" });
    });

    it("Non-owner cannot update creation fee", async () => {
      const newFee = new anchor.BN(3_000_000);

      let flag = "This should fail";
      try {
        await program.methods
          .updateCreationFee(newFee)
          .accounts({
            vesting: vestingAccountAlice.publicKey,
            owner: bob.publicKey,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        flag = "Failed";
        assert.isTrue(
          error.toString().includes("ConstraintRaw") || 
          error.toString().includes("Error") ||
          error.toString().includes("CustomError"),
          "Should fail with constraint error"
        );
      }
      assert.strictEqual(flag, "Failed", "Non-owner should not be able to update fee");
    });

    it("Non-owner cannot update treasury", async () => {
      const newTreasury = anchor.web3.Keypair.generate();

      let flag = "This should fail";
      try {
        await program.methods
          .updateTreasury(newTreasury.publicKey)
          .accounts({
            vesting: vestingAccountAlice.publicKey,
            owner: bob.publicKey,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        flag = "Failed";
        assert.isTrue(
          error.toString().includes("ConstraintRaw") || 
          error.toString().includes("Error") ||
          error.toString().includes("CustomError"),
          "Should fail with constraint error"
        );
      }
      assert.strictEqual(flag, "Failed", "Non-owner should not be able to update treasury");
    });

    it("Non-owner cannot transfer ownership", async () => {
      const newOwner = anchor.web3.Keypair.generate();

      let flag = "This should fail";
      try {
        await program.methods
          .transferOwnership(newOwner.publicKey)
          .accounts({
            vesting: vestingAccountAlice.publicKey,
            owner: bob.publicKey,
          })
          .signers([bob])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        flag = "Failed";
        assert.isTrue(
          error.toString().includes("ConstraintRaw") || 
          error.toString().includes("Error") ||
          error.toString().includes("CustomError"),
          "Should fail with constraint error"
        );
      }
      assert.strictEqual(flag, "Failed", "Non-owner should not be able to transfer ownership");
    });

    it("Cannot update treasury to zero address", async () => {
      let flag = "This should fail";
      try {
        await program.methods
          .updateTreasury(anchor.web3.PublicKey.default)
          .accounts({
            vesting: vestingAccountAlice.publicKey,
            owner: alice.publicKey,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        flag = "Failed";
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "ZeroAddress",
          "Should fail with ZeroAddress error"
        );
      }
      assert.strictEqual(flag, "Failed", "Should not allow zero address for treasury");
    });

    it("Cannot transfer ownership to zero address", async () => {
      let flag = "This should fail";
      try {
        await program.methods
          .transferOwnership(anchor.web3.PublicKey.default)
          .accounts({
            vesting: vestingAccountAlice.publicKey,
            owner: alice.publicKey,
          })
          .signers([alice])
          .rpc({ commitment: "confirmed" });
      } catch (error) {
        flag = "Failed";
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(
          err.error.errorCode.code,
          "ZeroAddress",
          "Should fail with ZeroAddress error"
        );
      }
      assert.strictEqual(flag, "Failed", "Should not allow zero address for new owner");
    });

    it("Updated creation fee applies to new vesting records", async () => {
      const newFee = new anchor.BN(500_000); // 0.0005 SOL

      await program.methods
        .updateCreationFee(newFee)
        .accounts({
          vesting: vestingAccountBob.publicKey,
          owner: bob.publicKey,
        })
        .signers([bob])
        .rpc({ commitment: "confirmed" });

      const vestingRecordTest = anchor.web3.Keypair.generate();
      const vestingStoragePDA = getVestingStoragePDA(vestingRecordTest.publicKey);
      const currentTime = Math.floor(Date.now() / 1000);

      const treasuryBalanceBefore = await provider.connection.getBalance(treasury.publicKey);

      await program.methods
        .createVesting(
          new anchor.BN(10_000_000),
          new anchor.BN(currentTime + 60),
          new anchor.BN(currentTime + 10060),
          new anchor.BN(10),
          new anchor.BN(1000),
          new anchor.BN(1_000_000)
        )
        .accounts({
          owner: bob.publicKey,
          vestingRecord: vestingRecordTest.publicKey,
          vestingStorage: vestingStoragePDA,
          vesting: vestingAccountBob.publicKey,
          treasury: treasury.publicKey,
        })
        .signers([bob, vestingRecordTest])
        .rpc({ commitment: "confirmed" });

      const treasuryBalanceAfter = await provider.connection.getBalance(treasury.publicKey);
      const feeReceived = treasuryBalanceAfter - treasuryBalanceBefore;

      assert.isTrue(
        feeReceived >= newFee.toNumber(),
        "Treasury should receive the updated creation fee"
      );
    });
  });
});

async function airdrop(
  connection: any,
  address: any,
  amount = 100 * anchor.web3.LAMPORTS_PER_SOL
) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}
