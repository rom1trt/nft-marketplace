import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card } from 'react-bootstrap'

export default function MyPurchases({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState([])

  useEffect(() => {
    const loadPurchasedItems = async () => {
      // Fetch purchased items from marketplace by quering ItemCreated events with the buyer set as the user
      const filter =  marketplace.filters.ItemSold(null,null,null,null,null,account)
      const results = await marketplace.queryFilter(filter)
      //Fetch metadata of each nft and add that to listedItem object.
      const purchases = await Promise.all(results.map(async i => {
        // fetch arguments from each result
        i = i.args
        // get uri url from nft contract
        const URI = await nft.tokenURI(i.tokenID)
        // use uri to fetch the nft metadata stored on ipfs 
        const response = await fetch(URI)
        const metadata = await response.json()
        // get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(i.itemID)
        // define listed item object
        let purchasedItem = {
          totalPrice,
          price: i.price,
          itemID: i.itemID,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image
        }
        return purchasedItem
      }))
      setLoading(false)
      setPurchases(purchases)
    }
    loadPurchasedItems()
  }, [account, marketplace, nft])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>No purchases</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {purchases.length > 0 ?
        <div className="px-5 container">
          <Row xs={1} md={2} lg={4} className="g-4 py-5">
            {purchases.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Footer>{ethers.utils.formatEther(item.totalPrice)} MATIC</Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No purchases</h2>
          </main>
        )}
    </div>
  )}
