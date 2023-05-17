/**



*/

import * as React from 'react'
import { MdOutlineSettings } from 'react-icons/md'
import { Form } from '../../packages/forms'
import { ScreenPlugin } from '../../packages/react-screens'
import { FormBuilder } from '../../packages/form-builder'
import { useCMS } from '../../react-tinacms'

export class GlobalFormPlugin implements ScreenPlugin {
  __type: ScreenPlugin['__type'] = 'screen'
  name: ScreenPlugin['name']
  Component: ScreenPlugin['Component']
  Icon: ScreenPlugin['Icon']
  layout: ScreenPlugin['layout']

  constructor(
    public form: Form,
    icon?: ScreenPlugin['Icon'],
    layout?: ScreenPlugin['layout']
  ) {
    this.name = form.label
    this.Icon = icon || MdOutlineSettings
    this.layout = layout || 'popup'
    this.Component = () => {
      const cms = useCMS()

      const cmsForm = cms.state.forms.find(
        ({ tinaForm }) => tinaForm.id === form.id
      )
      return <FormBuilder form={cmsForm} />
    }
  }
}
