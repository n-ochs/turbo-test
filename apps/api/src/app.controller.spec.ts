import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('appController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello).toBeDefined()
    })
  })

  describe('createUser', () => {
    it('should return the created user', () => {
      const user = {
        id: '1',
        email: '',
        name: 'nick',
      }
      expect(appController.createUser(user)).toEqual(user)
    })
  })
})
