import { Form } from './react-tinacms'

type FormListItem =
  | {
      type: 'document'
      path: string
      formId: string
      subItems: FormListItem[]
    }
  | { type: 'list'; label: string }

type FormList = {
  label: string
  id: string
  items: FormListItem[]
  // This value is somewhat duplicated from whats inside the items array, but it makes cleaning
  // Up orphaned forms easier.
  formIds: string[]
}

export type TinaAction =
  | {
      type: 'forms:add'
      value: Form
    }
  | {
      type: 'forms:remove'
      value: string
    }
  | {
      type: 'forms:clear'
    }
  | {
      type: 'form-lists:add'
      value: FormList
    }
  | {
      type: 'form-lists:remove'
      value: string
    }
  | {
      type: 'forms:set-active-form-id'
      value: string
    }
  | {
      type: 'forms:set-active-field-name'
      value: { formId: string; fieldName: string }
    }
  | {
      type: 'form-lists:clear'
    }
  | {
      type: 'set-edit-mode'
      value: 'visual' | 'basic'
    }
  | {
      type: 'increment-operation-index'
    }

export interface TinaState {
  activeFormId: string | null
  /**
   * Forms are wrapped here because we need `activeFieldName` to be reactive, so adding it as a propery
   * on the Form class won't work, unfortunately. So "form" at this level means tinaForm + activeFieldName
   *
   * The activeFieldName should probably not be in global state, and having it here means that forms
   * only work if they're registered as part of this top-level state. At the risk of touching too much code
   * all at once, putting state this high up at least allows us to not have to touch the Form class too much.
   * Longer term, replaceing Form with something stateful seems like the right approach
   */
  forms: { activeFieldName?: string | null; tinaForm: Form }[]
  formLists: FormList[]
  editingMode: 'visual' | 'basic'
}

export const initialState: TinaState = {
  activeFormId: null,
  forms: [],
  formLists: [],
  editingMode: 'basic',
}

// Our reducer function that uses a switch statement to handle our actions
export function tinaReducer(state: TinaState, action: TinaAction): TinaState {
  switch (action.type) {
    case 'set-edit-mode':
      return { ...state, editingMode: action.value }
    case 'forms:add':
      if (state.forms.find((f) => f.tinaForm.id === action.value.id)) {
        return state
      }
      return { ...state, forms: [...state.forms, { tinaForm: action.value }] }
    case 'forms:remove':
      return {
        ...state,
        forms: state.forms.filter((form) => form.tinaForm.id !== action.value),
      }
    case 'form-lists:clear': {
      return { ...state, formLists: [], forms: [] }
    }
    case 'form-lists:add': {
      const nextFormLists = [
        ...state.formLists.filter(({ id }) => id !== action.value.id),
        action.value,
      ]

      let activeFormId = state.activeFormId
      if (!activeFormId && state.formLists.length === 0) {
        action.value.items.forEach((item) => {
          if (item.type === 'document') {
            const form = state.forms.find(
              ({ tinaForm }) => item.formId === tinaForm.id
            )
            if (!form.tinaForm.global) {
              activeFormId = item.formId
            }
          }
        })
      }

      return { ...state, activeFormId, formLists: nextFormLists }
    }
    case 'form-lists:remove': {
      const nextFormLists = state.formLists.filter(
        ({ id }) => id !== action.value
      )
      const allFormIdsListed: string[] = []
      nextFormLists.forEach((formList) => {
        formList.formIds.forEach((id) => {
          allFormIdsListed.push(id)
        })
      })

      // Only keep forms that are associated with remaing form lists
      const nextForms = state.forms.filter(({ tinaForm }) =>
        allFormIdsListed.includes(tinaForm.id)
      )

      return {
        ...state,
        // Always set it to null for now, this will become more annoying for users
        // when `useTina` hooks are mounting client-side as a result of the app itself
        // rather than route navigation
        activeFormId: null,
        forms: nextForms,
        formLists: nextFormLists,
      }
    }
    case 'forms:set-active-form-id':
      if (action.value !== state.activeFormId) {
        return {
          ...state,
          activeFormId: action.value,
        }
      }
      return state
    case 'forms:set-active-field-name':
      const forms = state.forms.map((form) => {
        if (form.tinaForm.id === action.value.formId) {
          return {
            tinaForm: form.tinaForm,
            activeFieldName: action.value.fieldName,
          }
        }
        return form
      })
      return { ...state, forms }
    default:
      throw new Error(`Unhandled action ${action.type}`)
      return state
  }
}
