import AccountClaim from '../../../src/components/account/claim.vue';

import { load, mockHttp } from '../../util/http';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

describe('AccountClaim', () => {
  it('shows proper page title', () =>
    load('/account/claim?token=foo')
      .then(() => document.title.should.equal('Set Password | ODK Central')));

  it('focuses the input', () => {
    const component = mount(AccountClaim, { attachTo: document.body });
    component.get('input').should.be.focused();
  });

  it('shows a danger alert if the password is too short', async () => {
    const component = mount(AccountClaim);
    await component.get('input').setValue('x');
    await component.get('form').trigger('submit');
    component.should.alert('danger', 'Password must be at least 10 characters long.');
  });

  it('sends the correct request', () =>
    mockHttp()
      .mount(AccountClaim, {
        container: { router: mockRouter('/account/claim?token=foo') }
      })
      .request(async (component) => {
        await component.get('input').setValue('testPassword');
        return component.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { method, url, headers, data }) => {
        method.should.equal('POST');
        url.should.equal('/v1/users/reset/verify');
        headers.Authorization.should.equal('Bearer foo');
        data.should.eql({ new: 'testPassword' });
      })
      .respondWithProblem());

  it('implements some standard button things', () =>
    mockHttp()
      .mount(AccountClaim, {
        container: { router: mockRouter('/account/claim?token=foo') }
      })
      .testStandardButton({
        button: '.btn-primary',
        request: async (component) => {
          await component.get('input').setValue('testPassword');
          return component.get('form').trigger('submit');
        }
      }));

  it('shows a custom alert message for a 401.2 Problem', () =>
    mockHttp()
      .mount(AccountClaim, {
        container: { router: mockRouter('/account/claim?token=foo') }
      })
      .request(async (component) => {
        await component.get('input').setValue('testPassword');
        return component.get('form').trigger('submit');
      })
      .respondWithProblem({ code: 401.2, message: 'AccountClaim problem.' })
      .afterResponse(component => {
        component.should.alert('danger', (message) => {
          message.should.startWith('AccountClaim problem. The link in your email may have expired,');
        });
      }));

  describe('after a successful response', () => {
    const submit = () => load('/account/claim?token=foo')
      .request(async (app) => {
        console.log('Current Route:', app.vm.$route.fullPath);

        await Promise.resolve();
        await app.vm.$router.isReady();
        await new Promise(resolve => setTimeout(resolve, 0));
        const { nextTick } = await import('vue');
        await nextTick();

			  await new Promise(resolve => setTimeout(resolve, 0));
				await app.vm.$nextTick();
				await new Promise(resolve => setTimeout(resolve, 0));

				// 3. Debug: If it still fails, let's see what the Mock Server is doing
				// This will show if there are requests that haven't been matched yet
				// (Assuming 'this' in your snippet is part of a MockHttp instance)
				
				const c = app.findComponent(AccountClaim);
				if (!c.exists()) {
					throw new Error("Mock data likely not loaded. Container content: " + app.get('.container-fluid').html());
				}

        const component = app.getComponent(AccountClaim);
        await component.get('input').setValue('testPassword');
        return component.get('form').trigger('submit');
      })
      .respondWithSuccess();

    it.only('redirects to login', async () => {
      const app = await submit();
      app.vm.$route.path.should.equal('/login');
    });

    it('includes source=claim query param when redirecting to login', async () => {
      const app = await submit();
      app.vm.$route.path.should.equal('/login');
      app.vm.$route.query.source.should.equal('claim');
    });

    it('shows a success alert', async () => {
      const app = await submit();
      app.should.alert('success');
    });
  });
});
