import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API sağlık kontrolü' })
  check() {
    return {
      success: true,
      data: {
        status: 'ok',
        service: 'iteo-taksi-api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
