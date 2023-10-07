import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from '../reviews.service';
import { createMock } from '@golevelup/ts-jest';
import { Rating, Review } from '../entities/review.entity';
import { getModelToken } from '@nestjs/sequelize';
import { HttpException } from '@nestjs/common';
import { CreateReviewDto } from '../dto/create-review.dto';

const testReview: CreateReviewDto = { review:'review', rating: Rating.zero };
const testUserId = 'idDeMentirajaja';

describe('ReviewsService', () => {
  let reviewsService: ReviewsService;
  let review: typeof Review;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide:getModelToken(Review),
          useValue:{
            create:jest.fn( newReview => newReview),
          },
        },
      ],
    })
      .compile();

    reviewsService = module.get<ReviewsService>(ReviewsService);
    review = module.get<typeof Review>(getModelToken(Review));
  });

  describe('create method', () => {

    it('Must have called the "create" method with the passed in data', 
      async () => {
        const { create } = review;
        await reviewsService.create(testUserId, testReview);

        expect(create).toBeCalledWith({ ...testReview, userId:testUserId });
      },
    );

    it('Must return a review and a 201 status code',
      async () => {

        const iReview = {
          data: {
            ...testReview,
            userId: testUserId,
          },
          statusCode:201,
        };

        const newReview = await reviewsService.create(testUserId, testReview);

        expect(newReview).toEqual(iReview);

      },
    );

    it('Must throw an exception when creating a Review is not possible', 
      async () => {
        //review.create = () => undefined;
        jest.spyOn(review, 'create').mockReset();

        const result = await reviewsService.create(testUserId, testReview);

        expect(result).toBeInstanceOf(HttpException);
        expect(result).toHaveProperty('response', 'Algo salió mal al momento de crear la reseña');
        expect(result).toHaveProperty('status', 500);
      },
    );
  });
});
