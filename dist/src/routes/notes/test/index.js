"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
const fetch_1 = require("../../../../test/lib/fetch");
const index_1 = __importDefault(require("../../../index"));
describe('Notes', () => {
    let api;
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        api = new index_1.default();
        yield api.up([
            api.extensions.errors,
            api.routes.login,
            api.routes.notes.public,
            api.routes.notes,
        ]);
    }));
    after(() => api.down());
    describe('Create Category', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/notes', { title: 'new', uuid: 'fe2ff628-bec9-4908-82c4-8ee2bb7eaeaf', lang: 'aa' });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('with time status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/notes', {
                title: 'new',
                uuid: '023c2dfd-750f-455a-b969-6e6b6a564fa5',
                uuid_public: '754c103c-6e57-4b4a-b383-5061b102df74',
                time: new Date().toISOString(),
            });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Update Category', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.patch)('/notes/2', { title: 'new2', public: true, lang: 'zz' });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Get Public Categories', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = yield (0, fetch_1.get)('/notes/public');
            (0, chai_1.expect)(data.status).to.eql(200);
            res = yield data.json();
        }));
        it('only one public record', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res).to.be.an('Array').lengthOf(1);
        }));
    });
    describe('Get Public Categories by not exists lang', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = yield (0, fetch_1.get)('/notes/public?lang=aa');
            (0, chai_1.expect)(data.status).to.eql(200);
            res = yield data.json();
        }));
        it('only one public record', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res).to.be.an('Array').lengthOf(0);
        }));
    });
    describe('Get Public Categories by lang', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = yield (0, fetch_1.get)('/notes/public?lang=zz');
            (0, chai_1.expect)(data.status).to.eql(200);
            res = yield data.json();
        }));
        it('only one public record', () => __awaiter(void 0, void 0, void 0, function* () {
            (0, chai_1.expect)(res).to.be.an('Array').lengthOf(1);
        }));
    });
    describe('Get Public Categories By id', () => {
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = yield (0, fetch_1.get)('/notes/public/2');
            (0, chai_1.expect)(data.status).to.eql(200);
        }));
    });
    describe('Get Public Categories Data', () => {
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = yield (0, fetch_1.get)('/notes/public/2/data');
            (0, chai_1.expect)(data.status).to.eql(200);
        }));
    });
    describe('Get Non-Public Categories By id', () => {
        it('status 404', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = yield (0, fetch_1.get)('/notes/public/1');
            (0, chai_1.expect)(data.status).to.eql(404);
        }));
    });
    describe('Get Categories', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes');
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Get One Category', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes/2');
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('second category has new2 name', () => __awaiter(void 0, void 0, void 0, function* () {
            const data = yield res.json();
            (0, chai_1.expect)(data.title).to.eql('new2');
        }));
    });
    describe('Create Note', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/notes/1/data', { title: 'new data', body: 'Hi', uuid: '0de19904-ef99-4cba-8961-10320563e72a' });
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Create Couple Notes', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.post)('/notes/1/data', [
                { title: 'second data', body: 'Hi2', uuid: '6e0a0119-3aec-4ad7-bea0-05c0578a7cd7' },
                { title: 'third data', body: 'Hi3', uuid: '3c83aa91-ac65-4e70-9837-418ea45d0882' },
            ]);
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Get All Data', () => {
        let res;
        let data;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes/1/data');
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            data = yield res.json();
            (0, chai_1.expect)(data.data).to.be.an('Array').lengthOf(3);
        }));
    });
    describe('Search by body', () => {
        let res;
        let data;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes/1/data?body=Hi2');
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
        it('has relations', () => __awaiter(void 0, void 0, void 0, function* () {
            data = yield res.json();
            (0, chai_1.expect)(data.relations.notes_categories['1'].title).to.eql('new');
        }));
    });
    describe('Get Data by unknown Id return 404', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes/1/data/100');
            (0, chai_1.expect)(res.status).to.eql(404);
        }));
    });
    describe('Get Data by Id', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes/1/data/1');
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Get Second Data by Id', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes/1/data/2');
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Delete Data by Id', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.del)('/notes/1/data/1');
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Delete all Data', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.del)('/notes/1/data');
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Delete Category by Id', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.del)('/notes/1');
            (0, chai_1.expect)(res.status).to.eql(200);
        }));
    });
    describe('Get Deleted Data', () => {
        let res;
        it('status 404', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes/1/data/1');
            (0, chai_1.expect)(res.status).to.eql(404);
        }));
    });
    describe('Get Deleted Second Data', () => {
        let res;
        it('status 404', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes/1/data/');
            (0, chai_1.expect)(res.status).to.eql(404);
        }));
    });
    describe('Get Deleted Category', () => {
        let res;
        it('status 404', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/notes/1');
            (0, chai_1.expect)(res.status).to.eql(404);
        }));
    });
    describe('Get swagger', () => {
        let res;
        it('status 200', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield (0, fetch_1.get)('/swagger.yaml');
            (0, chai_1.expect)(res.status).to.eql(200);
            // console.log(await res.text());
        }));
    });
});
