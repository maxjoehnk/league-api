const { expect, use } = require('chai');
const { stub } = require('sinon');
const { enable, disable, registerMock, registerAllowable, registerAllowables } = require('mockery');
const asPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const { join } = require('path');

use(asPromised);
use(sinonChai);

const requirePath = '../src/db';

const dependencies = ['debug', 'path', 'util', 'tty', 'ms', 'supports-color', 'has-flag', './node.js', './debug'];

describe('db', function() {
    let db;
    let knexMock;

    before(() => {
        knexMock = stub();
        enable();
        registerMock('knex', knexMock);
        registerAllowables(dependencies);
        registerAllowable(requirePath);
        db = require(requirePath);
    });

    after(() => {
        disable();
    });

    it('should be an object', function() {
        expect(db).to.be.an.instanceof(Object);
    });

    describe('connect', () => {
        it('should exist', () => {
            expect(db.connect).to.be.an.instanceof(Function);
        });

        it('should return a db instance', () => {
            const instance = {
                migrate: () => {}
            };
            knexMock.returns(instance);
            expect(db.connect()).to.equal(instance);
        });

        it('should be called with the correct options', () => {
            db.connect();
            expect(knexMock).to.have.been.calledWith({
                client: 'sqlite3',
                connection: {
                    filename: './cache.sqlite'
                },
                useNullAsDefault: true
            });
        });
    });

    describe('migrate', () => {
        it('should exist', () => {
            expect(db.migrate).to.be.an.instanceof(Function);
        });

        it('should call db.migrate.latest', async() => {
            const instance = {
                migrate: {
                    latest: stub().resolves()
                }
            };
            await db.migrate(instance);
            expect(instance.migrate.latest).to.have.been.calledWith({
                directory: join(__dirname, '../migrations')
            });
        });
    });
});
