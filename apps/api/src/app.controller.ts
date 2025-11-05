import type { User } from '@repo/schemas'
import { Body, Controller, Get, Logger, Post, UsePipes } from '@nestjs/common'
import { UserSchema } from '@repo/schemas'
import * as v from 'valibot'
import { AppService } from './app.service'
import { ValibotValidationPipe } from './pipes/valibot.pipe'

@Controller()
export class AppController {
  private logger: Logger = new Logger(AppController.name)

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    try {
      const something = v.parse(UserSchema, {
        id: '1',
        email: ' ',
      })

      this.logger.log(`Parsed user: ${JSON.stringify(something)}`)
    }
    catch (error) {
      this.logger.error(`Error parsing user: ${error}`)
    }
    return this.appService.getHello()
  }

  @Post()
  @UsePipes(new ValibotValidationPipe(UserSchema))
  createUser(@Body() user: User) {
    return user
  }
}
