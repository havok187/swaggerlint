import {cli} from '../cli';

jest.mock('fs', () => ({
    existsSync: jest.fn(),
}));
jest.mock('js-yaml');
jest.mock('../index', () => ({
    swaggerlint: jest.fn(),
}));
jest.mock('../utils', () => ({
    log: jest.fn(),
    fetchUrl: jest.fn(),
    isYamlPath: jest.fn(),
}));
jest.mock('../defaultConfig', () => 'default-config');

beforeEach(() => {
    jest.resetAllMocks();
});

const name = 'swaggerlint-core';

describe('cli function', () => {
    it('exits when neither url nor swaggerPath are passed', async () => {
        const {swaggerlint} = require('../index');
        const result = await cli([]);

        expect(swaggerlint.mock.calls.length === 0).toBe(true);

        expect(result).toEqual({
            code: 1,
            errors: [
                {
                    name,
                    msg:
                        'Neither url nor path were provided for your swagger scheme',
                },
            ],
        });
    });

    it('exits when passed config path does not exist', async () => {
        const fs = require('fs');
        const {swaggerlint} = require('../index');

        fs.existsSync.mockReturnValueOnce(false);

        const path = 'lol/kek/foo/bar';
        const result = await cli(['--path', path]);

        expect(fs.existsSync.mock.calls).toEqual([[path]]);
        expect(swaggerlint.mock.calls.length === 0).toBe(true);
        expect(result).toEqual({
            code: 1,
            errors: [
                {
                    msg: 'File with a provided path does not exits.',
                    name,
                },
            ],
        });
    });

    it('exits when passed path to swagger does not exist', async () => {
        const fs = require('fs');
        const {swaggerlint} = require('../index');

        fs.existsSync.mockReturnValueOnce(false);

        const path = 'lol/kek/foo/bar';
        const result = await cli(['--config', path]);

        expect(fs.existsSync.mock.calls).toEqual([[path]]);
        expect(swaggerlint.mock.calls.length === 0).toBe(true);
        expect(result).toEqual({
            code: 1,
            errors: [
                {
                    msg: 'File at a provided config path does not exist.',
                    name,
                },
            ],
        });
    });

    it('exits when cannot fetch from passed url', async () => {
        const {swaggerlint} = require('../index');
        const {fetchUrl} = require('../utils');

        fetchUrl.mockImplementation(() => Promise.reject(null));

        const url = 'https://lol.org/openapi';
        const result = await cli(['--url', url]);

        expect(fetchUrl.mock.calls).toEqual([[url]]);
        expect(swaggerlint.mock.calls.length === 0).toBe(true);
        expect(result).toEqual({
            code: 1,
            errors: [
                {
                    msg: 'Cannot fetch swagger scheme from the provided url',
                    name,
                },
            ],
        });
    });

    it('returns code 0 when no errors are found', async () => {
        const {swaggerlint} = require('../index');
        const {fetchUrl} = require('../utils');

        swaggerlint.mockImplementation(() => []);
        fetchUrl.mockImplementation(() => Promise.resolve({}));

        const url = 'https://lol.org/openapi';
        const result = await cli(['--url', url]);

        expect(fetchUrl.mock.calls).toEqual([[url]]);
        expect(swaggerlint.mock.calls).toEqual([[{}, 'default-config']]);
        expect(result).toEqual({
            code: 0,
            errors: [],
        });
    });

    it('returns code 1 when errors are found', async () => {
        const {swaggerlint} = require('../index');
        const {fetchUrl} = require('../utils');
        const errors = [{name: 'foo', msg: 'bar'}];

        swaggerlint.mockImplementation(() => errors);
        fetchUrl.mockImplementation(() => Promise.resolve({}));

        const url = 'https://lol.org/openapi';
        const result = await cli(['--url', url]);

        expect(fetchUrl.mock.calls).toEqual([[url]]);
        expect(swaggerlint.mock.calls).toEqual([[{}, 'default-config']]);
        expect(result).toEqual({
            code: 1,
            errors,
        });
    });
});