import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { Country } from '../auth/entities/country.entity';

@ApiTags('countries')
@Controller({ path: 'countries', version: '1' })
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los países',
    operationId: 'getAllCountries',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de todos los países',
    type: [Country],
  })
  findAll() {
    return this.countriesService.findAll();
  }
}
