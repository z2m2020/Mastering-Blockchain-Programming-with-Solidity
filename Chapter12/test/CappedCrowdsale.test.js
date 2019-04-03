const { BN, ether, shouldFail } = require('openzeppelin-test-helpers');

const MSTCappedCrowdsaleMock = artifacts.require('MSTCappedCrowdsaleMock');
const SimpleToken = artifacts.require('MSTToken');

contract('CappedCrowdsale', function ([_, wallet]) {
  const rate = new BN('1');
  const cap = ether('100');
  const lessThanCap = ether('60');
  const tokenSupply = new BN('10').pow(new BN('22'));

  beforeEach(async function () {
    this.token = await SimpleToken.new();
  });

  it('rejects a cap of zero', async function () {
    await shouldFail.reverting(MSTCappedCrowdsaleMock.new(rate, wallet, this.token.address, 0));
  });

  context('with crowdsale', function () {
    beforeEach(async function () {
      this.crowdsale = await MSTCappedCrowdsaleMock.new(rate, wallet, this.token.address, cap);
      await this.token.transfer(this.crowdsale.address, tokenSupply);
    });

    describe('accepting payments', function () {
      it('should accept payments within cap', async function () {
        await this.crowdsale.send(cap.sub(lessThanCap));
        await this.crowdsale.send(lessThanCap);
      });

      it('should reject payments outside cap', async function () {
        await this.crowdsale.send(cap);
        await shouldFail.reverting(this.crowdsale.send(1));
      });

      it('should reject payments that exceed cap', async function () {
        await shouldFail.reverting(this.crowdsale.send(cap.addn(1)));
      });
    });

    describe('ending', function () {
      it('should not reach cap if sent under cap', async function () {
        await this.crowdsale.send(lessThanCap);
        (await this.crowdsale.capReached()).should.equal(false);
      });

      it('should not reach cap if sent just under cap', async function () {
        await this.crowdsale.send(cap.subn(1));
        (await this.crowdsale.capReached()).should.equal(false);
      });

      it('should reach cap if cap sent', async function () {
        await this.crowdsale.send(cap);
        (await this.crowdsale.capReached()).should.equal(true);
      });
    });
  });
});
