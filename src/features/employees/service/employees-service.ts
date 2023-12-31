import {
  http,
  ResponseWithData,
  ResponseWithMessage,
  ResponseWithPagination,
} from '@/shared/http'
import { Employee, EmployeeDetail } from '../types/employee'

export const EmployeesService = {
  createEmployee: async (body: FormData) => {
    const { data } = await http.post<ResponseWithMessage>('/api/users', body, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return data
  },

  getEmployees: async (params: {
    page: number
    perpage: number
    orderby: 'asc' | 'desc'
    sort: string
    search: string
    branch_id: number | null
    sortbyverified: string
    sortbyactivity: string
    role: string | null
  }) => {
    const { data } = await http<ResponseWithPagination<Employee[]>>(
      'api/users',
      { params },
    )
    return data
  },

  getEmployee: async (id: number) => {
    const { data } = await http<ResponseWithData<EmployeeDetail>>(
      `api/users/${id}/edit`,
    )

    return data
  },

  updateEmployee: async ({ id, body }: { id: number; body: FormData }) => {
    const { data } = await http.post<ResponseWithMessage>(
      `api/users/${id}`,
      body,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return data
  },

  deleteEmployee: async (id: number) => {
    const { data } = await http.delete<ResponseWithMessage>(`api/users/${id}`)

    return data
  },
}
