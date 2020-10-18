import { createConnection, getConnectionOptions, Connection } from 'typeorm'

export default async (name = 'default'): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions()

  const connection = createConnection(
    Object.assign(defaultOptions, {
      name,
      database:
        process.env.NODE_ENV === 'test'
          ? 'gostack_desafio09_tests'
          : defaultOptions.database,
    }),
  )

  return connection
}
