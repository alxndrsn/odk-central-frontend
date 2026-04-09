
import useFeatureFlags from '../../src/composables/feature-flags';

import { mount } from '../util/lifecycle';

const mountComponent = () => {
  const template = '<div :class="features">some text</div>';
  const setup = () => {
    const { features } = useFeatureFlags();
    return { features };
  };
  const component = mount(
    { template, setup },
    { attachTo: document.body }
  );
  return component;
};


describe('useFeatureFlags()', () => {
  it('should return new-web-forms when W + F is pressed', async () => {
    const component = mountComponent();

    component.classes().should.be.empty;

    await component.trigger('keydown', { key: 'w' });
    await component.trigger('keydown', { key: 'f' });

    component.classes()[0].should.be.eql('new-web-forms');

    await component.trigger('keyup', { key: 'w' });
    await component.trigger('keyup', { key: 'f' });

    component.classes().should.be.empty;
  });

  // Occasionally synthetic events can be fired without a .key prop, e.g.
  // Chrome password manager filling form fields.
  // See: https://github.com/getodk/central/issues/1280
  it.only('should not throw when a synthetic key event is fired', async () => {
    const component = mountComponent();

    component.classes().should.be.empty;

    // Our trigger opts must _define_ .key, so that the test framework doesn't substitute a KeyboardEvent with key:''
    await component.trigger('keydown', {});
    await component.trigger('keydown', { key:null });
    await component.trigger('keyup',   { key:undefined });
    await component.trigger('keydown', { key:{ toString:() => null } });
    await component.trigger('keydown', { key:{ toString:() => {} } });
    await component.trigger('keydown', { key:Object.create(null) });
  });
});
