package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type R2Storage struct {
	client     *s3.Client
	bucketName string
}

func NewR2Storage(endpoint, accessKey, secretKey, bucketName, region string) (*R2Storage, error) {
	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(region),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	// TODO: Configure R2 endpoint for S3 client
	client := s3.NewFromConfig(cfg)

	return &R2Storage{
		client:     client,
		bucketName: bucketName,
	}, nil
}

func (rs *R2Storage) Upload(ctx context.Context, key string, data io.Reader, contentType string) error {
	_, err := rs.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(rs.bucketName),
		Key:         aws.String(key),
		Body:        data,
		ContentType: aws.String(contentType),
	})
	return err
}

func (rs *R2Storage) Download(ctx context.Context, key string) ([]byte, error) {
	result, err := rs.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(rs.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}

func (rs *R2Storage) Delete(ctx context.Context, key string) error {
	_, err := rs.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(rs.bucketName),
		Key:    aws.String(key),
	})
	return err
}

func (rs *R2Storage) GeneratePresignedURL(ctx context.Context, key string, expiresIn int64) (string, error) {
	// TODO: Implement presigned URL generation
	return "", nil
}
