/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import faker from './faker';
import { dataStore, resetDataStores } from './data-store';



////////////////////////////////////////////////////////////////////////////////
// UTILITIES

const pathValue = (object, path) => {
  let node = object;
  for (const name of path.split('.')) {
    node = node[name];
    if (node == null) return node;
  }
  return node;
};

const pick = (object, propertyNames) => {
  const result = {};
  for (const name of propertyNames)
    result[name] = object[name];
  return result;
};

const omit = (object, propertyNames) => {
  const result = Object.assign({}, object);
  for (const name of propertyNames)
    delete result[name];
  return result;
};



////////////////////////////////////////////////////////////////////////////////
// VALIDATORS

const validateDateOrder = (path1, path2) => (object) => {
  const date1 = pathValue(object, path1);
  if (date1 == null) return true;
  const date2 = pathValue(object, path2);
  return date2 == null || new Date(date1).getTime() <= new Date(date2).getTime();
};

const validateUniqueness = (propertyNames) => (object, store) => {
  for (let i = 0; i < store.size; i += 1) {
    if (propertyNames.every(name => object[name] === store.get(i)[name]))
      return false;
  }
  return true;
};



////////////////////////////////////////////////////////////////////////////////
// TEST DATA

const testData = Object.assign(
  {},

  dataStore({
    name: 'administrators',
    factory: () => ({
      displayName: faker.name.findName(),
      email: faker.internet.email(),
      meta: null
    }),
    validate: [
      validateUniqueness(['email'])
    ],
    sort: ['email']
  }),

  dataStore({
    name: 'sessions',
    id: false,
    updatedAt: false,
    factory: () => ({
      token: faker.app.token(),
      expiresAt: faker.date.future()
    })
  }),

  dataStore({
    name: 'extendedFieldKeys',
    factory: () => ({
      displayName: faker.name.findName(),
      token: faker.app.token(),
      meta: null,
      lastUsed: faker.random.arrayElement([faker.date.past().toISOString(), null]),
      createdBy: pick(
        testData.administrators.randomOrCreatePast(),
        ['id', 'displayName', 'meta', 'createdAt', 'updatedAt']
      )
    }),
    validate: [
      validateDateOrder('createdBy.createdAt', 'createdAt'),
      validateDateOrder('createdAt', 'lastUsed')
    ],
    sort: [(fieldKey) => -(new Date(fieldKey.createdAt).getTime())],
    views: {
      simpleFieldKeys: (extendedFieldKey) => {
        const fieldKey = omit(extendedFieldKey, ['lastUsed']);
        fieldKey.createdBy = fieldKey.createdBy.id;
        return fieldKey;
      }
    }
  }),

  dataStore({
    name: 'extendedForms',
    factory: () => {
      const xmlFormId = `a${faker.random.alphaNumeric(8)}`;
      const name = faker.random.arrayElement([faker.name.findName(), null]);
      const anySubmission = faker.random.boolean();
      return {
        xmlFormId,
        name,
        version: faker.random.arrayElement([faker.random.number(), null]),
        // This does not actually match the XML below.
        hash: faker.random.number({ max: (16 ** 32) - 1 }).toString(16).padStart('0'),
        submissions: anySubmission ? faker.random.number({ min: 1 }) : 0,
        lastSubmission: anySubmission ? faker.date.past().toISOString() : null,
        createdBy: pick(
          testData.administrators.randomOrCreatePast(),
          ['id', 'displayName', 'meta', 'createdAt', 'updatedAt']
        ),
        xml: `<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>${name}</h:title>
    <model>
      <instance>
        <data id="${xmlFormId}">
          <meta>
            <instanceID/>
          </meta>
          <name/>
          <age/>
        </data>
      </instance>

      <bind nodeset="/data/meta/instanceID" type="string" readonly="true()" calculate="concat('uuid:', uuid())"/>
      <bind nodeset="/data/name" type="string"/>
      <bind nodeset="/data/age" type="int"/>
    </model>

  </h:head>
  <h:body>
    <input ref="/data/name">
      <label>What is your name?</label>
    </input>
    <input ref="/data/age">
      <label>What is your age?</label>
    </input>
  </h:body>
</h:html>`
      };
    },
    validate: [
      validateUniqueness(['xmlFormId']),
      validateDateOrder('createdBy.createdAt', 'createdAt'),
      validateDateOrder('createdAt', 'lastSubmission')
    ],
    sort: [(form) => -(new Date(form.updatedAt || form.createdAt).getTime())],
    views: {
      simpleForms: (extendedForm) => {
        const form = omit(extendedForm, ['lastSubmission', 'submissions']);
        form.createdBy = form.createdBy.id;
        return form;
      }
    }
  }),

  dataStore({
    name: 'extendedSubmissions',
    factory: () => {
      const form = testData.extendedForms.randomOrCreatePast();
      const instanceId = faker.random.uuid();
      return {
        formId: form.id,
        instanceId,
        xml: `<data id="${form.id}"><orx:meta><orx:instanceID>${instanceId}</orx:instanceID></orx:meta><name>Alice</name><age>30</age></data>`,
        submitter: pick(
          testData.administrators.randomOrCreatePast(),
          ['id', 'displayName', 'meta', 'createdAt', 'updatedAt']
        )
      };
    },
    validate: [
      validateUniqueness(['formId', 'instanceId']),
      validateDateOrder('submitter.createdAt', 'createdAt')
    ],
    sort: [(form) => -(new Date(form.updatedAt || form.createdAt).getTime())]
  })
);

testData.reset = resetDataStores;

export default testData;
