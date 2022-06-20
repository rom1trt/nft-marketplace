import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card } from 'react-bootstrap'

export default function MyListedItems({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true)
  const [listedItems, setListedItems] = useState([])
  const [soldItems, setSoldItems] = useState([])
  useEffect(() => {
    const loadListedItems = async () => {
      // Load all sold items that the user listed
      const itemCount = await marketplace.itemCount()
      let listedItems = []
      let soldItems = []
      for (let indx = 1; indx <= itemCount; indx++) {
        const i = await marketplace.idToItem(indx)
        if (i.seller.toLowerCase() === account) {
          // get uri url from nft contract
          const URI = await nft.tokenURI(i.tokenID)
          // use uri to fetch the nft metadata stored on ipfs
          const response = await fetch(URI)
          const metadata = await response.json()
          // get total price of item (item price + fee)
          const totalPrice = await marketplace.getTotalPrice(i.itemID)
          // define listed item object
          let item = {
            totalPrice,
            price: i.price,
            itemID: i.itemID,
            name: metadata.name,
            description: metadata.description,
            image: metadata.image
          }
          listedItems.push(item)
          // Add listed item to sold items array if sold
          if (i.sold) soldItems.push(item)
        }
      }
      setLoading(false)
      setListedItems(listedItems)
      setSoldItems(soldItems)
    }
    loadListedItems()
  }, [account, marketplace, nft])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>No assets owned</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {listedItems.length > 0 ?
        <div className="px-5 py-3 container">
            <h2>Listed & Sold</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {listedItems.map((item, idx) => (
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
            <h2>No listed assets</h2>
          </main>
        )}
    </div>
  );
}