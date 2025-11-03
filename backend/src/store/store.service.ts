const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
import { Injectable } from '@nestjs/common';

@Injectable()
export class StoreService {
  connectShopify(input: any) {
    const shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY,
      scopes: ['read_products', 'write_products'], // Example scopes
      hostName: process.env.SHOPIFY_APP_URL,
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: true,
    });

    const authRoute = shopify.auth.beginAuth(
      input.req,
      input.res,
      input.shop,
      '/shopify/callback',
      false,
    );

    return { authUrl: authRoute };
  }
}
